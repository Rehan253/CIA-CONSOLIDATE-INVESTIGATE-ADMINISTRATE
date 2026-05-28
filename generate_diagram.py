import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe

fig, axes = plt.subplots(1, 2, figsize=(22, 13))
fig.patch.set_facecolor('#1a1a2e')

# ── helpers ──────────────────────────────────────────────────────────────────

def box(ax, x, y, w, h, label, sublabel='', color='#16213e', border='#4a90d9',
        text_color='white', fontsize=11, subfontsize=9):
    rect = FancyBboxPatch((x - w/2, y - h/2), w, h,
                          boxstyle='round,pad=0.05',
                          facecolor=color, edgecolor=border, linewidth=2, zorder=3)
    ax.add_patch(rect)
    ytext = y + 0.05 if sublabel else y
    ax.text(x, ytext, label, ha='center', va='center',
            color=text_color, fontsize=fontsize, fontweight='bold', zorder=4)
    if sublabel:
        ax.text(x, y - 0.22, sublabel, ha='center', va='center',
                color='#aaaacc', fontsize=subfontsize, zorder=4)

def group_box(ax, x, y, w, h, label, color='#0f3460', border='#4a90d9', alpha=0.35):
    rect = FancyBboxPatch((x - w/2, y - h/2), w, h,
                          boxstyle='round,pad=0.05',
                          facecolor=color, edgecolor=border,
                          linewidth=1.5, alpha=alpha, zorder=1)
    ax.add_patch(rect)
    ax.text(x - w/2 + 0.15, y + h/2 - 0.18, label,
            color=border, fontsize=9, fontweight='bold',
            style='italic', zorder=2)

def arrow(ax, x1, y1, x2, y2, label='', color='#4a90d9'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=2), zorder=5)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx + 0.08, my, label, color='#ccccff', fontsize=8, zorder=6)

def cylinder(ax, x, y, w, h, label, sublabel='', color='#1a4a2e', border='#44bb77'):
    ell_h = 0.18
    body = mpatches.FancyBboxPatch((x - w/2, y - h/2), w, h,
                                   boxstyle='round,pad=0.03',
                                   facecolor=color, edgecolor=border, linewidth=2, zorder=3)
    ax.add_patch(body)
    top = mpatches.Ellipse((x, y + h/2), w, ell_h,
                           facecolor=color, edgecolor=border, linewidth=2, zorder=4)
    ax.add_patch(top)
    ytext = y + 0.05 if sublabel else y
    ax.text(x, ytext, label, ha='center', va='center',
            color='white', fontsize=10, fontweight='bold', zorder=5)
    if sublabel:
        ax.text(x, y - 0.22, sublabel, ha='center', va='center',
                color='#aaffaa', fontsize=8, zorder=5)

# ════════════════════════════════════════════════════════════════════════════
# LEFT PANEL — Application Architecture
# ════════════════════════════════════════════════════════════════════════════
ax = axes[0]
ax.set_facecolor('#1a1a2e')
ax.set_xlim(0, 9)
ax.set_ylim(0, 11)
ax.axis('off')
ax.set_title('Application Architecture', color='white', fontsize=16,
             fontweight='bold', pad=15)

# User
box(ax, 4.5, 10, 2.2, 0.7, 'Browser / User',
    color='#2d2d5e', border='#8888ff', fontsize=12)

# Frontend group
group_box(ax, 4.5, 8.0, 4.2, 1.6, 'Frontend Container  (Docker)', color='#1a3a5c', border='#4a90d9')
box(ax, 4.5, 8.2, 2.8, 0.6, 'React App', 'TypeScript', color='#0d47a1', border='#42a5f5')
box(ax, 4.5, 7.55, 2.8, 0.6, 'nginx', 'port 8080', color='#0d47a1', border='#42a5f5')

# Backend network group
group_box(ax, 4.5, 5.1, 8.0, 3.6, 'Backend Docker Network  (bridge)', color='#1a2e1a', border='#44bb77')

# API
box(ax, 2.5, 5.3, 2.8, 1.3, 'Express API', 'Node.js / TypeScript\nport 3001',
    color='#1b5e20', border='#66bb6a', fontsize=11, subfontsize=8)

# MySQL
cylinder(ax, 6.5, 5.3, 2.4, 1.3, 'MySQL 5.7', 'port 3306',
         color='#1a3a2e', border='#44bb77')

# JWT / Helmet labels on API box
ax.text(2.5, 4.45, 'helmet  •  JWT auth  •  CORS', ha='center',
        color='#99ff99', fontsize=7.5, zorder=6)

# Volumes group
group_box(ax, 4.5, 2.2, 7.0, 1.6, 'Docker Named Volumes', color='#2e1a0a', border='#ff9944')
cylinder(ax, 2.5, 2.2, 2.4, 1.0, 'logs volume', '/var/log/app\naccess.log',
         color='#3e2200', border='#ff9944')
cylinder(ax, 6.5, 2.2, 2.4, 1.0, 'db_data volume', '/var/lib/mysql',
         color='#3e2200', border='#ff9944')

# .env box
box(ax, 4.5, 0.65, 3.0, 0.65, '.env  (secrets)',
    'DB_PASS  •  JWT_SECRET  •  MYSQL_ROOT_PASSWORD',
    color='#4a0000', border='#ff4444', fontsize=10, subfontsize=7.5)

# Arrows
arrow(ax, 4.5, 9.65, 4.5, 8.52, 'HTTP :8080')
arrow(ax, 4.5, 7.24, 4.5, 6.55, 'REST :3001', color='#42a5f5')
# React to API (horizontal across group boundary)
ax.annotate('', xy=(3.9, 5.3), xytext=(3.1, 5.3),
            arrowprops=dict(arrowstyle='->', color='#42a5f5', lw=2), zorder=5)
# API to MySQL
arrow(ax, 3.9, 5.3, 5.3, 5.3, 'TypeORM', color='#66bb6a')
# API to logs
arrow(ax, 2.5, 4.67, 2.5, 2.72, 'morgan\nlogs', color='#ff9944')
# MySQL to db_data
arrow(ax, 6.5, 4.67, 6.5, 2.72, 'persists', color='#ff9944')
# .env to API (dashed)
ax.annotate('', xy=(2.5, 4.67), xytext=(3.8, 0.97),
            arrowprops=dict(arrowstyle='->', color='#ff6666', lw=1.5,
                            linestyle='dashed'), zorder=5)
ax.annotate('', xy=(6.5, 4.67), xytext=(5.2, 0.97),
            arrowprops=dict(arrowstyle='->', color='#ff6666', lw=1.5,
                            linestyle='dashed'), zorder=5)

# ════════════════════════════════════════════════════════════════════════════
# RIGHT PANEL — CI Pipeline
# ════════════════════════════════════════════════════════════════════════════
ax2 = axes[1]
ax2.set_facecolor('#1a1a2e')
ax2.set_xlim(0, 9)
ax2.set_ylim(0, 11)
ax2.axis('off')
ax2.set_title('GitLab CI Pipeline', color='white', fontsize=16,
              fontweight='bold', pad=15)

# Developer
box(ax2, 4.5, 10.1, 2.6, 0.7, 'Developer',
    color='#2d2d5e', border='#8888ff', fontsize=12)

# git push
box(ax2, 4.5, 9.0, 2.8, 0.65, 'git push → GitLab',
    color='#1a1040', border='#ff6b35', text_color='#ff9966', fontsize=11)

# Stage 1
group_box(ax2, 4.5, 7.35, 8.2, 1.6, 'Stage 1 — Build  (parallel)', color='#0d2240', border='#4a90d9')
box(ax2, 2.4, 7.35, 3.2, 1.0, 'build-backend', 'docker build cia-backend',
    color='#0d2a4a', border='#4a90d9', subfontsize=8)
box(ax2, 6.6, 7.35, 3.2, 1.0, 'build-frontend', 'docker build cia-frontend',
    color='#0d2a4a', border='#4a90d9', subfontsize=8)

# Stage 2
group_box(ax2, 4.5, 5.1, 8.2, 1.9, 'Stage 2 — Test  (parallel, only if Stage 1 passes)',
          color='#0d2a1a', border='#44bb77')
box(ax2, 1.6, 5.1, 2.4, 1.2, 'typecheck\nbackend', 'tsc --noEmit',
    color='#0d3a1a', border='#66bb6a', subfontsize=8)
box(ax2, 4.5, 5.1, 2.4, 1.2, 'test\nbackend', 'jest\n--passWithNoTests',
    color='#0d3a1a', border='#66bb6a', subfontsize=8)
box(ax2, 7.4, 5.1, 2.4, 1.2, 'build-check\nfrontend', 'yarn build',
    color='#0d3a1a', border='#66bb6a', subfontsize=8)

# Result
box(ax2, 4.5, 3.5, 4.0, 0.85, 'PASS - Pipeline Passes',
    'code is safe to merge',
    color='#1a3a1a', border='#44ff88', text_color='#88ff88',
    fontsize=12, subfontsize=9)

# fail path
box(ax2, 4.5, 2.2, 4.0, 0.85, 'FAIL - Pipeline Fails',
    'merge blocked, fix and push again',
    color='#3a1a1a', border='#ff4444', text_color='#ff8888',
    fontsize=12, subfontsize=9)

# Security note
ax2.text(4.5, 1.25,
         'Both containers run as service-web (non-root)\n'
         'Secrets injected via GitLab CI/CD Variables — never in code',
         ha='center', va='center', color='#aaaacc', fontsize=9,
         style='italic',
         bbox=dict(facecolor='#111130', edgecolor='#444466', boxstyle='round,pad=0.4'))

# Arrows CI
arrow(ax2, 4.5, 9.75, 4.5, 9.33, '', color='#ff6b35')
# push to stage1 jobs
ax2.annotate('', xy=(2.4, 7.86), xytext=(4.2, 8.68),
             arrowprops=dict(arrowstyle='->', color='#4a90d9', lw=2), zorder=5)
ax2.annotate('', xy=(6.6, 7.86), xytext=(4.8, 8.68),
             arrowprops=dict(arrowstyle='->', color='#4a90d9', lw=2), zorder=5)
# stage1 to stage2 jobs
ax2.annotate('', xy=(1.6, 5.62), xytext=(2.4, 6.85),
             arrowprops=dict(arrowstyle='->', color='#66bb6a', lw=2), zorder=5)
ax2.annotate('', xy=(4.5, 5.62), xytext=(4.5, 6.85),
             arrowprops=dict(arrowstyle='->', color='#66bb6a', lw=2), zorder=5)
ax2.annotate('', xy=(7.4, 5.62), xytext=(6.6, 6.85),
             arrowprops=dict(arrowstyle='->', color='#66bb6a', lw=2), zorder=5)
# stage2 to result
ax2.annotate('', xy=(4.5, 3.93), xytext=(4.5, 4.62),
             arrowprops=dict(arrowstyle='->', color='#44ff88', lw=2), zorder=5)
# result to fail (dashed)
ax2.annotate('', xy=(4.5, 2.63), xytext=(4.5, 3.08),
             arrowprops=dict(arrowstyle='->', color='#ff4444', lw=1.5,
                             linestyle='dashed'), zorder=5)
ax2.text(4.85, 2.85, 'if any job fails', color='#ff8888', fontsize=8, zorder=6)

plt.tight_layout(pad=2.0)
out = '/home/rehan/projects/CIA-CONSOLIDATE-INVESTIGATE-ADMINISTRATE/architecture.png'
plt.savefig(out, dpi=150, bbox_inches='tight', facecolor='#1a1a2e')
print(f'saved to {out}')
