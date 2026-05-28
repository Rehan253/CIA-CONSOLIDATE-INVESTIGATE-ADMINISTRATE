module.exports ={
   type: "mysql",
   host: process.env.DB_HOST,
   port: 3306,
   username: process.env.DB_USER || "root",
   password: process.env.DB_PASS || "root",
   database: "dev_db",
   synchronize: true,
   logging: false,
   migrationsRun: true,
   "entities": [
      "src/entity/**/*.ts"
   ],
   "migrations": [
      "src/migration/**/*.ts"
   ],
   "subscribers": [
      "src/subscriber/**/*.ts"
   ],
   "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
   }
};
