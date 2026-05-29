#!/bin/bash

# vm hardening script
# based on pentest findings from VM2, VM4 and CIA machine 3
# run as root: sudo ./vm_harden.sh

if [ "$EUID" -ne 0 ]; then
    echo "run as root"
    exit 1
fi

echo ""
echo "starting hardening on $(hostname) - $(date)"
echo "kernel: $(uname -r)"
echo "ip: $(hostname -I | awk '{print $1}')"
echo ""

# ------------------------------------------------
# ssh hardening
# found in all 3 vms - root login with password admin
# ------------------------------------------------

echo "hardening ssh..."

cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# no root login over ssh
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
grep -q "PermitRootLogin" /etc/ssh/sshd_config || echo "PermitRootLogin no" >> /etc/ssh/sshd_config

# no password login - key only
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
grep -q "PasswordAuthentication" /etc/ssh/sshd_config || echo "PasswordAuthentication no" >> /etc/ssh/sshd_config

# disable x11 forwarding - vm2 v-09
sed -i 's/^#*X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
grep -q "X11Forwarding" /etc/ssh/sshd_config || echo "X11Forwarding no" >> /etc/ssh/sshd_config

# disable gssapi - vm2 v-10
sed -i 's/^#*GSSAPIAuthentication.*/GSSAPIAuthentication no/' /etc/ssh/sshd_config
grep -q "GSSAPIAuthentication" /etc/ssh/sshd_config || echo "GSSAPIAuthentication no" >> /etc/ssh/sshd_config

# disable tcp and agent forwarding - can be abused for pivoting
sed -i 's/^#*AllowTcpForwarding.*/AllowTcpForwarding no/' /etc/ssh/sshd_config
grep -q "AllowTcpForwarding" /etc/ssh/sshd_config || echo "AllowTcpForwarding no" >> /etc/ssh/sshd_config
sed -i 's/^#*AllowAgentForwarding.*/AllowAgentForwarding no/' /etc/ssh/sshd_config
grep -q "AllowAgentForwarding" /etc/ssh/sshd_config || echo "AllowAgentForwarding no" >> /etc/ssh/sshd_config

# max 3 attempts then disconnect
sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 3/' /etc/ssh/sshd_config
grep -q "MaxAuthTries" /etc/ssh/sshd_config || echo "MaxAuthTries 3" >> /etc/ssh/sshd_config

# 5 min idle timeout
sed -i 's/^#*ClientAliveInterval.*/ClientAliveInterval 300/' /etc/ssh/sshd_config
grep -q "ClientAliveInterval" /etc/ssh/sshd_config || echo "ClientAliveInterval 300" >> /etc/ssh/sshd_config
sed -i 's/^#*ClientAliveCountMax.*/ClientAliveCountMax 2/' /etc/ssh/sshd_config
grep -q "ClientAliveCountMax" /etc/ssh/sshd_config || echo "ClientAliveCountMax 2" >> /etc/ssh/sshd_config

systemctl restart sshd
echo "[+] ssh hardened"

# ------------------------------------------------
# service accounts - no bash shell
# vm2 v-08: service-web had /bin/bash
# ------------------------------------------------

echo "fixing service account shells..."

for u in service service-web git gitea; do
    if id "$u" &>/dev/null; then
        usermod -s /sbin/nologin "$u"
        echo "[+] $u -> nologin"
    fi
done

# ------------------------------------------------
# stop postfix - not needed on any of the 3 vms
# vm2 v-06 and vm4 both had it running for no reason
# ------------------------------------------------

echo "stopping unnecessary services..."

for svc in postfix cups bluetooth avahi-daemon; do
    if systemctl is-active "$svc" &>/dev/null; then
        systemctl stop "$svc"
        systemctl disable "$svc"
        echo "[+] $svc stopped"
    fi
done

# ------------------------------------------------
# shadow file permissions
# cia machine 3 vuln-8: shadow was readable
# ------------------------------------------------

echo "locking shadow file..."

chmod 000 /etc/shadow
chown root:root /etc/shadow
chmod 644 /etc/passwd
echo "[+] shadow -> 000, passwd -> 644"

# ------------------------------------------------
# dirty cow check
# all 3 vms running kernel 3.10.0-327 from 2015
# cve-2016-5195
# ------------------------------------------------

echo "checking for dirty cow..."

KVER=$(uname -r)
KMAJ=$(echo "$KVER" | cut -d. -f1)
KMIN=$(echo "$KVER" | cut -d. -f2)

if [ "$KMAJ" -lt 4 ] || { [ "$KMAJ" -eq 4 ] && [ "$KMIN" -lt 8 ]; }; then
    echo "[!] kernel $KVER is vulnerable to dirty cow (cve-2016-5195)"
    echo "[!] fix: yum update kernel && reboot (needs internet)"
else
    echo "[+] kernel $KVER - dirty cow patched"
fi

# check if dirty cow was already run on this machine
if grep -q "firefart" /etc/passwd 2>/dev/null; then
    echo "[!] firefart entry found in /etc/passwd - dirty cow was run here"
    if [ -f /tmp/passwd.bak ]; then
        cp /tmp/passwd.bak /etc/passwd
        echo "[+] passwd restored from backup"
    else
        echo "[!] no backup found - fix /etc/passwd manually"
    fi
fi

# ------------------------------------------------
# docker hardening
# lots of issues across all 3 vms
# ------------------------------------------------

if ! command -v docker &>/dev/null; then
    echo "[!] docker not installed - skipping docker section"
else
    echo "checking docker..."

    # port 222 - vm2 v-04 and v-14: gitea container exposed ssh on 222
    if docker ps --format '{{.Ports}}' | grep -q ":222->"; then
        echo "[!] port 222 is exposed on a container - remove 222:22 from docker-compose.yml"
    else
        echo "[+] port 222 not exposed"
    fi

    # mysql on all interfaces - vm2 v-13 and cia machine 3 vuln-5
    if ss -tulpn | grep -q "0.0.0.0:3306"; then
        echo "[!] mysql exposed on 0.0.0.0:3306 - should be 127.0.0.1:3306 only"

        # try to fix it automatically
        for db in dev_db m2_db_1 mysql db; do
            if docker ps --format '{{.Names}}' | grep -q "^${db}$"; then
                echo "found container $db - rebinding to localhost..."
                IMG=$(docker inspect "$db" --format '{{.Config.Image}}')
                ENVS=$(docker inspect "$db" --format '{{range .Config.Env}}-e "{{.}}" {{end}}')
                docker stop "$db"
                docker rm "$db"
                eval docker run -d --name "$db" $ENVS -p 127.0.0.1:3306:3306 "$IMG"
                echo "[+] $db restarted - mysql now on 127.0.0.1:3306 only"
            fi
        done
    else
        echo "[+] mysql not exposed on all interfaces"
    fi

    # containers running as root - vm2 v-15, vm4 vuln-06, cia vuln-9
    echo "checking container users..."
    docker ps -q | while read cid; do
        cname=$(docker inspect "$cid" --format '{{.Name}}' | tr -d '/')
        cuser=$(docker inspect "$cid" --format '{{.Config.User}}')
        if [ -z "$cuser" ]; then
            echo "[!] $cname is running as root - add USER directive to dockerfile"
        else
            echo "[+] $cname running as $cuser"
        fi
    done

    # docker.sock mounted - vm4 vuln-07: portainer had full host access via socket
    docker ps -q | while read cid; do
        cname=$(docker inspect "$cid" --format '{{.Name}}' | tr -d '/')
        if docker inspect "$cid" --format '{{range .Mounts}}{{.Source}} {{end}}' | grep -q "docker.sock"; then
            echo "[!] $cname has docker.sock mounted - this gives full host access"
        fi
    done

    # hardcoded creds in docker-compose - vm2 v-11
    find /home -name "docker-compose.yml" 2>/dev/null | while read f; do
        if grep -qE "(PASSWORD|SECRET|KEY)\s*=" "$f"; then
            echo "[!] hardcoded credentials in $f - move to .env file (chmod 600)"
        fi
    done

    # clean up old containers and images
    docker container prune -f > /dev/null
    docker image prune -f > /dev/null
    echo "[+] docker cleaned up"

    # pull updated images if internet available
    if ping -c 1 -W 2 8.8.8.8 &>/dev/null; then
        echo "internet available - updating docker images..."
        docker images --format '{{.Repository}}:{{.Tag}}' | grep -v '<none>' | while read img; do
            docker pull "$img"
        done
        echo "[+] images updated"
    else
        echo "[!] no internet - docker images not updated (same issue as all 3 vms)"
        echo "[!] when internet available run: docker images --format '{{.Repository}}:{{.Tag}}' | xargs -L1 docker pull"
    fi

fi

# ------------------------------------------------
# system update
# kernel 3.10.0-327 needs yum update kernel
# ------------------------------------------------

echo "checking for system updates..."

if ping -c 1 -W 2 8.8.8.8 &>/dev/null; then
    echo "internet available - running yum update..."
    yum update -y
    echo "[+] system updated - reboot to apply kernel update"
else
    echo "[!] no internet - system update skipped"
    echo "[!] add NAT adapter in virtualbox then run: yum update -y && reboot"
fi

# ------------------------------------------------
# done
# ------------------------------------------------

echo ""
echo "done - $(date)"
echo ""
echo "still needs manual fix:"
echo "  - change root and admin passwords if not done yet"
echo "  - move docker-compose credentials to .env file"
echo "  - reboot after kernel update"
echo ""
