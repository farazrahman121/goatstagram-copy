const mysql = require('mysql2');
const config = require('../config.json'); // Load configuration
const process = require('process');
require('dotenv').config();


/**
 * Implementation of a singleton pattern for database connections
 * 
 * This module will handle all database connections and queries, 
 * and and module that requires this will be effectively using
 * the same connection.
 */
var the_db = null;

module.exports = {
    get_db_connection,
    set_db_connection,
    create_tables,
    insert_items,
    send_sql,
    close_db
}

/**
 * For mocking
 * 
 * @param {*} db 
 */
function set_db_connection(db) {
    the_db = db;
}

function close_db() {
    if (the_db) {
        the_db.end();
        the_db = null;
    }
}

/**
 * Get a connection to the MySQL database
 * 
 * @returns An SQL connection object or mock object
 */
async function get_db_connection() {
    if (the_db) {
        return the_db;
    }
    
    dbconfig = config.database;
    dbconfig.user = process.env.RDS_USER;
    dbconfig.password = process.env.RDS_PWD;
    the_db = mysql.createConnection(dbconfig);

    console.log(dbconfig.user);

    // Connect to MySQL
    return new Promise(function(resolve, reject) {
        the_db.connect(err => {
            if (err) 
                return reject(err);
            else {
                console.log('Connected to the MySQL server.');
                // return the_db;
                return resolve(the_db);
            }
        });
    });
}

/**
 * Fundamental SQL query function
 * 
 * This function will first ensure that a connection 
 * to the database is established, and establish 
 * a connection if one is not found.
 * 
 * @param {*} query string with COMPLETE sql query (no placeholders)
 * @returns promise of results
 */
async function send_sql(sql, params=[]) {
    const dbo = await get_db_connection();
    return new Promise((resolve, reject)=> {
            // CHANGED THIS TO EXECUTE
            dbo.execute(sql, params,  (error, results)=>{
                if (error) return reject(error); 
                else return resolve(results);
        });
    });    
  }

// Unmodified send_sql wrapper
async function create_tables(query, params=[]) {
    return send_sql(query);
}

// Slightly modified send_sql wrapper
async function insert_items(query, params=[]) {
    result = await send_sql(query, params);
    return result.affectedRows;
}