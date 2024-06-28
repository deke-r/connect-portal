const express= require('express');
const app = express();
const mainRoute = require('./src/routes/route');
const dbConnection = require('./src/db/connection');
const bodyparse= require('body-parser')
const logger=require('./util/logger')
app.use(bodyparse.json());
const dotenv=require('dotenv')
dotenv.config({ path: './config.env' });
// console.log(process.env) 


// app.use(bodyParser.urlencoded({extended: true}));
// DATABASE CONNECTION
dbConnection();

app.use(bodyparse.urlencoded({extended:true,limit:'50mb',parameterLimit:50000}))

app.use('/static', express.static("public"));
app.use('/static/images', express.static('/var/log/jubilant/images'));
app.use('/', mainRoute);





app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    next(err);
});

// SET EJS VIEW ENGINE
app.set('view engine', 'ejs');

// app.listen(process.env.PORT | 8081, ()=> {
//     console.log("Server is running on 8081");
// });

const port = process.env.PORT || 8082;
try {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
} catch (error) {
    logger.error('Error in server running: ' + error);
}


