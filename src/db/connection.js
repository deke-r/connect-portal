const mysql = require('mysql');
const util = require('util');

const createConnectionPool = async () => {
    const pool = mysql.createPool({


// user: 'root',
// password: 'f3a54d600135878b36814c7462a87b16',
// host: 'localhost',
// port: '3306',
// database: 'activityportal',

user: 'testapr',
password: 'THYfI9xH%h[itdq',
host: '13.234.68.241',
port: '3306',
database: 'testdb', 

 
        timezone: 'GMT',
    });

    const getConnectionAsync = util.promisify(pool.getConnection).bind(pool);

    try {
        const connection = await getConnectionAsync();
        console.log('Connected to MySQL database successfully...');
        connection.release();
        return pool;
    } catch (err) {
        console.error('Error connecting to MySQL:', err.message);
        throw err;
    }
};

module.exports = createConnectionPool;



// user: 'testapr',
// password: 'THYfI9xH%h[itdq',
// host: '13.234.68.241',
// port: '3306',
// database: 'testdb', 









