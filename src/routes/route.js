const express = require('express');
const app = express();
const route = express.Router();
const OracleDB = require('oracledb');
const dbConnection = require('../db/connection');
const Swal = require('sweetalert2')
const multer = require('multer');
const cookie = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');
const moment = require('moment');
const cors = require('cors');
app.use(cors())
const logger = require('../../util/logger');
const axios = require('axios');
const qs = require('qs');
const { error } = require('console');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { v4: uuidv4} = require('uuid');
dotenv.config({ path: './config.env' });




const sess_time = 1000 * 60 * 60 * 2;

route.use(session({
    secret: "SESS_SECRET:'{}'!@#$$#!SESS_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: sess_time,
        sameSite: 'strict',
    }
}));

route.use(cookie());



route.use((req, res, next) => {
    res.locals.role = req.session.role;
    res.locals.emp = req.session.employeeId;
    res.locals.emp_name = req.session.emp_Name;
    res.locals.designation = req.session.designation

    next();
});


const authenticate = (req, res, next) => {
    // console.log(req.session.role, 'roleee')
    if (req.session.employeeId && req.session.role) {
        next();
    } else {
        res.redirect('/');
    }
};


function getCurrentDateAndTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const reversedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return reversedDate;
}


route.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error destroying session' });
        } else {
            res.clearCookie('connect.sid');
            res.json({ redirect: '/' });
        }
    });
});






route.get('/admin_dashboard', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId;
        // console.log(emp)
        res.render('dashboard')
        logger.info('GET admin_dashboard accessed ' + emp);
    } catch (error) {
        logger.error('Error occurred in GET admin_dashboard ' + emp);
    }
})
route.get('/super_admin_dashboard', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId;
        res.render('super_admin_dashboard')
        logger.info('GET admin_dashboard accessed ' + emp);
    } catch (error) {
        logger.error('Error occurred in GET admin_dashboard ' + emp);
    }
})


route.get('/employee_dashboard', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId;
        res.render('employee_dashboard')
        logger.info('GET employee_dashboard accessed ' + emp);
    } catch (error) {
        logger.error('Error occurred in GET employee_dashboard ' + emp);
    }
})


route.get('/commercial_dashboard', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId;
        res.render('commercial_dashboard')
        logger.info('GET commercial_dashboard accessed ' + emp);
    } catch (error) {
        logger.error('Error occurred in GET commercial_dashboard ' + emp);
    }
})







route.get('/view_pending_btl', authenticate, async (req, res) => {
    try {
        const emp = req.session.employeeId;
        const pool = await dbConnection();

        const query = `
            SELECT 
                jc.*, 
                DATE_FORMAT(jc.DateOfMeet, '%d-%m-%Y') AS formattedDate,
                jl.EMP_NAME, 
                jl.REP_MANAGER_ID, 
                jl.REP_MANAGER_NAME, 
                jl.BRANCH, 
                jl.ZONE,
                jc.Manager_Approval_status,
                ms.action_status
            FROM 
                Jacpl_ContractorMeet jc 
                INNER JOIN JUBILANT_LOGIN jl ON jc.emp_id = jl.EMP_CODE
                LEFT JOIN meet_status ms ON jc.Manager_Approval_status = ms.action_id
            WHERE 
                jc.is_active = 1 
            ORDER BY 
                jc.rc_id DESC 
            LIMIT 
                20`;

        pool.query(query, (err, results) => {
            if (err) {
                console.error(err);
                logger.error(`Error occurred in GET view_pending_btl for emp_code ${emp}: ${err}`);
                return res.status(500).send('Internal Server Error');
            }

            results.forEach(result => {
                result.DateOfMeet = result.formattedDate;
                delete result.formattedDate;
            });


            console.log(results)
            res.render('view_pending_btl', { data: results });
            logger.info(`GET view_pending_btl accessed for emp_code ${emp}`);
        });

    } catch (error) {
        console.error(error);
        logger.error(`Error occurred in GET view_pending_btl for emp_code ${emp}: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});




route.post('/filter_view_pending_btl', async (req, res) => {
    try {
        const con = await dbConnection();
        const start_date = req.body.sd;
        const end_date = req.body.ed;
        const userInput = req.body.userInput;

        const moment = require('moment');
        let start_date_formatted = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let end_date_formatted = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

        let query;
        let params;

        if (userInput.length > 0) {
            if (start_date && end_date) {
                query = `
                    SELECT j.*, c.*, ms.action_status
                    FROM JUBILANT_LOGIN j
                    INNER JOIN Jacpl_ContractorMeet c ON j.EMP_CODE = c.emp_id
                    LEFT JOIN meet_status ms ON c.Manager_Approval_status = ms.action_id
                    WHERE c.rc_id = ? AND DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.is_active = 1 
                    ORDER BY c.rc_id ASC
                `;
                params = [userInput, start_date_formatted, end_date_formatted];
            } else {
                query = `
                    SELECT j.*, c.*, ms.action_status
                    FROM JUBILANT_LOGIN j
                    INNER JOIN Jacpl_ContractorMeet c ON j.EMP_CODE = c.emp_id
                    LEFT JOIN meet_status ms ON c.Manager_Approval_status = ms.action_id
                    WHERE c.rc_id = ? AND c.is_active = 1 
                    ORDER BY c.rc_id ASC
                `;
                params = [userInput];
            }
        } else {
            if (start_date && end_date) {
                query = `
                    SELECT j.*, c.*, ms.action_status
                    FROM JUBILANT_LOGIN j
                    INNER JOIN Jacpl_ContractorMeet c ON j.EMP_CODE = c.emp_id
                    LEFT JOIN meet_status ms ON c.Manager_Approval_status = ms.action_id
                    WHERE DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.is_active = 1 
                    ORDER BY c.rc_id ASC
                `;
                params = [start_date_formatted, end_date_formatted];
            } else {
                query = `
                    SELECT j.*, c.*, ms.action_status
                    FROM JUBILANT_LOGIN j
                    INNER JOIN Jacpl_ContractorMeet c ON j.EMP_CODE = c.emp_id
                    LEFT JOIN meet_status ms ON c.Manager_Approval_status = ms.action_id
                    WHERE c.is_active = 1 
                    ORDER BY c.rc_id ASC
                `;
                params = [];
            }
        }

        con.query(query, params, function (err, results) {
            if (err) {
                console.log(err);
                logger.error('Error occurred in POST filter_view_pending_btl ' + err + "::Query::" + query);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }
            logger.info('POST filter_view_pending_btl accessed ');
            res.json({ data: results });
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error('Error occurred in POST filter_view_pending_btl ' + err);
    }
});





route.get('/inshop', authenticate, async function (req, res) {
    try {
        const pool = await dbConnection();
        let emp=req.session.employeeId;
      

        let settingKey = 'Inshop-with-gift';
        let settingKey1 = 'Inshop-without-gift';

        let roleQuery = `SELECT DISTINCT UI_TITLE, BACKEND_TITLE FROM MEET_BUDGET WHERE SETTING_KEY = '${settingKey}' OR SETTING_KEY = '${settingKey1}'`;

        pool.query(roleQuery, function (error, results, fields) {
         
            if (error) {
                console.log(error);
            } else {


            }

        let query = `SELECT vertical FROM vertical_details WHERE is_active = 1;`
        pool.query(query, (err, result) => {
            if (err) throw err;
    
            res.render('inshop', { inshopData: results,data: result,emp:emp });
        })
        });
    } catch (error) {
        console.log(error);

    }
});




route.post('/jeaAPIhitsga', async (req, res) => {
    let empId = req.body.no

    let data = qs.stringify({
        'loginInfoSales': JSON.stringify({ "empId": empId, "empPassword": "", "empVal": "1" })
    });
    let config = {
        method: 'post',
        url: process.env.JACPL_ATTENDED_API,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'JSESSIONID=432B7D6836A988969AFFA9B470F6DC12'
        },
        data: data
    };

    const response = await axios.request(config);
    
    let res1 = response.data.empId
    let res2 = response.data.empName

    res.json({ emppid: res1, empnamee: res2 });

})
route.post('/jeaAPIhitinshop', async (req, res) => {
    let empId = req.body.no

    let data = qs.stringify({
        'loginInfoSales': JSON.stringify({ "empId": empId, "empPassword": "", "empVal": "1" })
    });
    let config = {
        method: 'post',
        url: process.env.JACPL_ATTENDED_API,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'JSESSIONID=432B7D6836A988969AFFA9B470F6DC12'
        },
        data: data
    };

    const response = await axios.request(config);

    // console.log(JSON.stringify(response.data));

    let res1 = response.data.empId
    let res2 = response.data.empName

    // console.log(res1)
    // console.log(res2)

    res.json({ emppid: res1, empnamee: res2 });

})
route.post('/jeaAPIhitdealer', async (req, res) => {
    let empId = req.body.no

    let data = qs.stringify({
        'loginInfoSales': JSON.stringify({ "empId": empId, "empPassword": "", "empVal": "1" })
    });
    let config = {
        method: 'post',
        url: process.env.JACPL_ATTENDED_API,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'JSESSIONID=432B7D6836A988969AFFA9B470F6DC12'
        },
        data: data
    };

    const response = await axios.request(config);

    // console.log(JSON.stringify(response.data));

    let res1 = response.data.empId
    let res2 = response.data.empName

    // console.log(res1)
    // console.log(res2)

    res.json({ emppid: res1, empnamee: res2 });

})
route.post('/jeaAPIhitcontractor', async (req, res) => {
    let empId = req.body.no

    let data = qs.stringify({
        'loginInfoSales': JSON.stringify({ "empId": empId, "empPassword": "", "empVal": "1" })
    });
    let config = {
        method: 'post',
        url: process.env.JACPL_ATTENDED_API,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'JSESSIONID=432B7D6836A988969AFFA9B470F6DC12'
        },
        data: data
    };

    const response = await axios.request(config);

    // console.log(JSON.stringify(response.data));

    let res1 = response.data.empId
    let res2 = response.data.empName

    // console.log(res1)
    // console.log(res2)

    res.json({ emppid: res1, empnamee: res2 });

})




route.get('/sga_meet', authenticate, async function (req, res) {
    try {

        const pool = await dbConnection();

        let emp=req.session.employeeId;

        let settingKey = 'sga-with-gift';
        let settingKey1 = 'sga-without-gift';

        let roleQuery = `SELECT DISTINCT UI_TITLE, BACKEND_TITLE FROM MEET_BUDGET WHERE SETTING_KEY = '${settingKey}' OR SETTING_KEY = '${settingKey1}'`;

        pool.query(roleQuery, function (error, results, fields) {
            // console.log(results, 'results')
            if (error) {
                console.log(error);
            } else {


            }

            let query = `SELECT vertical FROM vertical_details WHERE is_active = 1;`
            pool.query(query, (err, result) => {
                if (err) throw err;
           
            res.render('sga_meet', { inshopData: results,data: result,emp:emp });
        });
        });
    } catch (error) {
        console.log(error);

    }
});



route.get('/view_rejected_approved_btl', authenticate, (req, res) => {
    try {
        let emp = req.session.employeeId
        res.render('view_rejected_approved_btl')
        logger.info('Accessed GET in view_rejected_approved_btl ' + emp)
    } catch (error) {
        logger.error('Error GET in view_rejected_approved_btl ' + emp + error)
    }
})

route.get('/', function (req, res) {
    try {

        res.render('login')
        logger.info('Accessed GET in login ')
    } catch (error) {
        logger.error('Error GET in login ')

    }


})

route.get('/forgetpassword', function (req, res) {
    try {

        res.render('forgetpassword')
        logger.info('Accessed GET in forgetpassword ')

    } catch (error) {
        logger.error('Error GET in forgetpassword ')

    }
})


route.post('/forgot_pass', async (req, res) => {
    try {
        let empId = req.body.empid;
        // console.log(empId, 'empid');

        let data = qs.stringify({
            'forgetPassword': JSON.stringify({ "empId": empId })
        });
        let config = {
            method: 'post',
            url: process.env.FORGOT_PASS_API,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'JSESSIONID=CEFDB103484442F7E5D478CE1DE7CE5E'
            },
            data: data
        };

        const response = await axios.request(config);

        // console.log(JSON.stringify(response.data.result));

        res.json(response.data.result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
        logger.error(error + ' in forgot pass')
    }
});





route.get('/contractor', authenticate, async function (req, res) {
    try {

        const pool = await dbConnection();
        let emp=req.session.employeeId;

        let settingKey = 'ContractorMeet-with-gift';
        let settingKey1 = 'ContractorMeet-without-gift';

        let roleQuery = `SELECT DISTINCT UI_TITLE,BACKEND_TITLE FROM MEET_BUDGET WHERE SETTING_KEY = '${settingKey}' OR SETTING_KEY = '${settingKey1}'`;

        pool.query(roleQuery, function (error, results, fields) {
            // console.log(results, 'results')
            if (error) {
                console.log(error);
            } else {


            }


        
        let query = `SELECT vertical FROM vertical_details WHERE is_active = 1;`
        pool.query(query, (err, result) => {
            if (err) throw err;
      
            
            res.render('contractor', { inshopData: results,data: result,emp:emp });
        })

        });
    } catch (error) {
        console.log(error);

    }
});





route.get('/dealer_meet', authenticate, async function (req, res) {
    try {

        const pool = await dbConnection();

        let emp=req.session.employeeId;
        let settingKey = 'DealerMeet-with-gift';
        let settingKey1 = 'DealerMeet-without-gift';

        let roleQuery = `SELECT DISTINCT UI_TITLE,BACKEND_TITLE FROM MEET_BUDGET WHERE SETTING_KEY = '${settingKey}' OR SETTING_KEY = '${settingKey1}'`;

        pool.query(roleQuery, function (error, results, fields) {
            // console.log(results, 'results')
            if (error) {
                console.log(error);
            } else {


            }

          
        let query = `SELECT vertical FROM vertical_details WHERE is_active = 1;`
        pool.query(query, (err, result) => {
            if (err) throw err;
            // console.log(results)
          
            res.render('dealer_meet', { inshopData: results,data: result,emp:emp });
        })

        });
    } catch (error) {
        console.log(error);

    }
});






route.get('/eventreport', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('eventreport')
        logger.info('Accessed GET in eventreport ' + emp)

    } catch (error) {
        logger.error('Error GET in eventreport ' + emp + error)

    }


})

route.get('/detail_event', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('detail_event')
        logger.info('Accessed GET in detail_event ' + emp)

    } catch (error) {
        logger.error('Error GET in detail_event ' + emp + error)

    }


})
route.get('/dealer_detail_event', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('dealer_detail_event')
        logger.info('Accessed GET in detail_event ' + emp)

    } catch (error) {
        logger.error('Error GET in detail_event ' + emp + error)

    }


})
route.get('/iclub_report', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('iclub_report')
        logger.info('Accessed GET in iclub_report ' + emp)

    } catch (error) {
        logger.error('Error GET in iclub_report ' + emp + error)

    }
})
route.get('/upload_account_st', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('upload_account_st')
        logger.info('Accessed GET in upload_account_st ' + emp)

    } catch (error) {
        logger.error('Error GET in upload_account_st ' + emp + error)

    }
})
route.get('/download_account_st', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('download_account_st')
        logger.info('Accessed GET in download_account_st ' + emp)

    } catch (error) {
        logger.error('Error GET in download_account_st ' + emp + error)

    }
})
route.get('/download_account_st_pdf', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('download_account_st_pdf')
        logger.info('Accessed GET in download_account_st_pdf ' + emp)

    } catch (error) {
        logger.error('Error GET in download_account_st_pdf ' + emp + error)

    }
})
route.get('/dealer_upload', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('dealer_upload')
        logger.info('Accessed GET in download_account_st_pdf ' + emp)

    } catch (error) {
        logger.error('Error GET in download_account_st_pdf ' + emp + error)

    }
})
route.get('/pdf', function (req, res) {

    res.render('pdf')

})






route.post('/download_account_st', async (req, res) => {
    try {

        let emp = req.session.employeeId
        logger.info('Starting POST download_account_st ' + emp)
        const date = new Date();

        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();

        const currentDate = moment(`${day}-${month}-${year}`, 'DD-MM-YYYY').format('YYYY-MM-DD');



        const d_code = req.body.data

        const con = await dbConnection();

        const dbdate = `SELECT start_date FROM Jacpl_master WHERE ID=?`;
        con.query(dbdate, [1], function (err, results1) {
            if (err) throw err;
            logger.error('Error in post download_account_st dbdate ' + emp + err + dbdate)
            const sd = results1[0].start_date
            const sd_date = moment(sd).format('YYYY-MM-DD')




            const fmsd_date = moment(sd).format('DD-MM-YYYY')
            const fcr_date = moment(currentDate).format('DD-MM-YYYY')
            let roleQuery = `SELECT CUST_NO,FIRM_NAME,DATE,COMP,TYPE,DOC_NO,REFERANCE,DEBIT,CREDIT,LINE_BALANCE FROM Account_Statement WHERE CUST_NO= ? AND DATE BETWEEN ? AND ?`;
            con.query(roleQuery, [d_code, sd_date, currentDate], function (error, results, fields) {
                if (error) {
                    console.log(error)
                    logger.error('Error in post download_account_st roleQuery ' + emp + error + roleQuery)

                } else {
                    // console.log(results)

                    let count = `SELECT SUM(DEBIT) AS SUM_DEBIT,SUM(CREDIT) AS SUM_CREDIT FROM Account_Statement WHERE CUST_NO= ? AND DATE BETWEEN ? AND ?`
                    con.query(count, [d_code, sd_date, currentDate], (err, results_count) => {
                        if (err) throw err;
                        logger.error('Error in post download_account_st count ' + emp + err + count)

                        // console.log(results_count)



                        res.json({ data: results, start_date: fmsd_date, currentDate: fcr_date, sum_debit: results_count[0].SUM_DEBIT, sum_credit: results_count[0].SUM_CREDIT });
                        logger.info('Accessed Post in download_account_st' + emp)
                    })






                }

            })





        });



    } catch (err) {
        console.log(err)
        logger.error('Error POST in download_account_st ' + emp + error)

    }


})




route.get('/event_report_pdf/:emp_id/:rc_id/:meetTypeText', authenticate, async (req, res) => {
    try {
        let emp = req.params.emp_id;
        let rc_id = req.params.rc_id;
        let meetType = req.params.meetTypeText
        console.log(meetType)
        let con = await dbConnection();

        let loginQuery = `SELECT EMP_NAME, REP_MANAGER_ID, REP_MANAGER_NAME, BRANCH, ZONE FROM JUBILANT_LOGIN WHERE EMP_CODE=?`;
        con.query(loginQuery, [emp], function (err, loginResults) {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Internal Server Error' });
                logger.error('Error get eventreport_pdf loginQuery ' + emp + error + '::query::' + loginQuery);
                return;
            }

            const roleQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id=?`;

            con.query(roleQuery, [rc_id], function (error, roleResults) {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Internal Server Error' });
                    logger.error('Error get eventreport_pdf roleQuery ' + emp + error + '::query::' + roleQuery);
                    return;
                }

                if (meetType.trim() === 'Dealer Meet') {
                    const detail_query = `SELECT * FROM Jacpl_DealerMeetDetails WHERE rc_id=?`
                    con.query(detail_query, [rc_id], function (err, results) {
                        if (err) throw err;


                        let date = roleResults[0].DateOfMeet


                        const moment = require('moment');
                        let dataformat = moment(date, 'DD-MMM-YYYY').format('DD-MMM-YYYY');

                        // logger.info('Accessed get eventreport_pdf  roleQuery ' + emp);
                        res.render('dealer_event_report_pdf', { data1: loginResults, data2: roleResults, emp: emp, data3: results, dataformat: dataformat });
                    })
                } else {

                    const detail_query = `SELECT * FROM Jacpl_ContractorMeetDetails WHERE rc_id=?`
                    con.query(detail_query, [rc_id], function (err, results) {
                        if (err) throw err;


                        let date = roleResults[0].DateOfMeet


                        const moment = require('moment');
                        let dataformat = moment(date, 'DD-MMM-YYYY').format('DD-MMM-YYYY');

                        // logger.info('Accessed get eventreport_pdf  roleQuery ' + emp);
                        res.render('event_report_pdf', { data1: loginResults, data2: roleResults, emp: emp, data3: results, dataformat: dataformat });
                    })
                }


            });
        });
    } catch (err) {
        console.log(err);
    }
});
route.get('/view_pending_btl_pdf/:emp_id/:rc_id/:meetTypeText', authenticate, async (req, res) => {
    try {
        let emp = req.params.emp_id;
        let rc_id = req.params.rc_id;
        let meetType = req.params.meetTypeText
        console.log(meetType)
        let con = await dbConnection();

        let loginQuery = `SELECT EMP_NAME, REP_MANAGER_ID, REP_MANAGER_NAME, BRANCH, ZONE FROM JUBILANT_LOGIN WHERE EMP_CODE=?`;
        con.query(loginQuery, [emp], function (err, loginResults) {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Internal Server Error' });
                logger.error('Error get eventreport_pdf loginQuery ' + emp + error + '::query::' + loginQuery);
                return;
            }

            const roleQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id=?`;

            con.query(roleQuery, [rc_id], function (error, roleResults) {
                if (error) {
                    console.log(error);
                    res.status(500).json({ error: 'Internal Server Error' });
                    logger.error('Error get eventreport_pdf roleQuery ' + emp + error + '::query::' + roleQuery);
                    return;
                }

                if (meetType.trim() === 'Dealer Meet') {
                    const detail_query = `SELECT * FROM Jacpl_DealerMeetDetails WHERE rc_id=?`
                    con.query(detail_query, [rc_id], function (err, results) {
                        if (err) throw err;


                        let date = roleResults[0].DateOfMeet


                        const moment = require('moment');
                        let dataformat = moment(date, 'DD-MMM-YYYY').format('DD-MMM-YYYY');

                        // logger.info('Accessed get eventreport_pdf  roleQuery ' + emp);
                        res.render('view_dealer_pending_btl_pdf', { data1: loginResults, data2: roleResults, emp: emp, data3: results, dataformat: dataformat });
                    })
                } else {

                    const detail_query = `SELECT * FROM Jacpl_ContractorMeetDetails WHERE rc_id=?`
                    con.query(detail_query, [rc_id], function (err, results) {
                        if (err) throw err;


                        let date = roleResults[0].DateOfMeet


                        const moment = require('moment');
                        let dataformat = moment(date, 'DD-MMM-YYYY').format('DD-MMM-YYYY');

                        // logger.info('Accessed get eventreport_pdf  roleQuery ' + emp);
                        res.render('view_pending_btl_pdf', { data1: loginResults, data2: roleResults, emp: emp, data3: results, dataformat: dataformat });
                    })
                }


            });
        });
    } catch (err) {
        console.log(err);
    }
});




// route.get('/manage_pending_btl/:emp_id/:rc_nid', authenticate, async (req, res) => {
//     try {
//         const emp_id = req.params.emp_id;
//         logger.info('Starting GET manage_pending_btl ' + emp_id);
//         const rc_id = req.params.rc_nid;
//         const pool = await dbConnection();

//         const loginQuery = `SELECT EMP_NAME, REP_MANAGER_ID, REP_MANAGER_NAME, BRANCH, ZONE FROM JUBILANT_LOGIN WHERE EMP_CODE=?`;
//         pool.query(loginQuery, [emp_id], (loginErr, loginResults) => {
//             if (loginErr) {
//                 console.error(loginErr);
//                 logger.error('Error in GET manage_pending_btl loginQuery ' + emp_id + loginErr + "::query::" + loginQuery);
//                 return res.status(500).json({ error: 'Internal Server Error' });
//             }

//             const btlQuery = `SELECT *, 
//                                     DATE_FORMAT(DateOfMeet, '%d-%m-%Y') AS formattedDate,
//                                     DATE_FORMAT(Manager_Approval_date, '%d-%m-%Y') AS formattedApprovedBTLDate
//                               FROM Jacpl_ContractorMeet 
//                               WHERE is_active = 1 AND rc_id=?`;
//             pool.query(btlQuery, [rc_id], (btlErr, btlResults) => {
//                 if (btlErr) {
//                     console.error(btlErr);
//                     logger.error('Error in GET manage_pending_btl btlQuery ' + emp_id + btlErr + "::query::" + btlQuery);
//                     return res.status(500).send('Internal Server Error');
//                 }

//                 btlResults.forEach(result => {
//                     result.DateOfMeet = result.formattedDate;
//                     result.Manager_Approval_date = result.formattedApprovedBTLDate;
//                     delete result.formattedDate;
//                     delete result.formattedApprovedBTLDate;
//                 });
//                 const photoQueryForRCId = `
//                 SELECT 
//                     Event_Photo1, 
//                     Event_Photo2, 
//                     Event_Photo3 
//                 FROM 
//                     Jacpl_ContractorMeet 
//                 WHERE 
//                     emp_id=? AND rc_id=?
//             `;

//                 pool.query(photoQueryForRCId, [emp_id, rc_id], (photoErr, photoResultsForRCId) => {
//                     if (photoErr) {
//                         console.error(photoErr);
//                         logger.error('Error in GET manage_pending_btl photoQuery ' + emp_id + photoErr + "::query::" + photoQueryForRCId);
//                         return res.status(500).send('Internal Server Error');
//                     }

//                     console.log("Photo Results for RC Id:", photoResultsForRCId);

//                     const photoQueryForEmpId = `SELECT rc_id,Event_Photo1,Event_Photo2,Event_Photo3 FROM Jacpl_ContractorMeet WHERE emp_id=? AND rc_id!=?`;
//                     pool.query(photoQueryForEmpId, [emp_id, rc_id], (photoErrForEmpId, photoResultsForEmpId) => {
//                         if (photoErrForEmpId) {
//                             console.error(photoErrForEmpId);
//                             logger.error('Error in GET manage_pending_btl photoQuery ' + emp_id + photoErrForEmpId + "::query::" + photoQueryForEmpId);
//                             return res.status(500).send('Internal Server Error');
//                         }

//                         console.log("Photo Results for Emp Id:",photoResultsForEmpId);

//                         const duplicates = [];

//                         const photosForRCId = extractPhotos(photoResultsForRCId);

//                         const photosForOtherRCIds = extractPhotos(photoResultsForEmpId);

//                         if (!photosForRCId || !photosForOtherRCIds) {
//                             return res.status(500).send('Internal Server Error');
//                         }

//                         photosForRCId.forEach(photo => {
//                             if (photosForOtherRCIds.includes(photo)) {
//                                 duplicates.push({ photo: photo, rc_ids: [rc_id, ...photoResultsForEmpId.filter(row => row.Event_Photo1 === photo || row.Event_Photo2 === photo || row.Event_Photo3 === photo).map(row => row.rc_id)] });
//                             }
//                         });

//                         console.log("Duplicates:", duplicates);

//                         res.render('manage_pending_btl', { data: btlResults, data2: loginResults, emp_id: emp_id, rc_id: rc_id, duplicatePhotos: duplicates });
//                         logger.info('Accessed GET manage_pending_btl ' + emp_id);
//                     });
//                 });

//                 function extractPhotos(results) {
//                     if (!results || !Array.isArray(results)) {
//                         return [];
//                     }
//                     const photos = [];
//                     results.forEach(row => {
//                         const rowPhotos = [row.Event_Photo1, row.Event_Photo2, row.Event_Photo3].filter(photo => photo);
//                         photos.push(...rowPhotos);
//                     });
//                     return photos;
//                 }



//             });
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//         logger.error('Error GET in manage_pending_btl ' + emp_id + error);
//     }
// });


route.get('/manage_pending_btl/:emp_id/:rc_nid', authenticate, async (req, res) => {
    try {
        const emp_id = req.params.emp_id;
        logger.info('Starting GET manage_pending_btl ' + emp_id);
        const rc_id = req.params.rc_nid;
        const pool = await dbConnection();

        const loginQuery = `SELECT EMP_NAME, REP_MANAGER_ID, REP_MANAGER_NAME, BRANCH, ZONE FROM JUBILANT_LOGIN WHERE EMP_CODE=?`;
        pool.query(loginQuery, [emp_id], (loginErr, loginResults) => {
            if (loginErr) {
                console.error(loginErr);
                logger.error('Error in GET manage_pending_btl loginQuery ' + emp_id + loginErr + "::query::" + loginQuery);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            const btlQuery = `SELECT *, 
                                    DATE_FORMAT(DateOfMeet, '%d-%m-%Y') AS formattedDate,
                                    DATE_FORMAT(Manager_Approval_date, '%d-%m-%Y') AS formattedApprovedBTLDate
                              FROM Jacpl_ContractorMeet 
                              WHERE is_active = 1 AND rc_id=?`;
            pool.query(btlQuery, [rc_id], (btlErr, btlResults) => {
                if (btlErr) {
                    console.error(btlErr);
                    logger.error('Error in GET manage_pending_btl btlQuery ' + emp_id + btlErr + "::query::" + btlQuery);
                    return res.status(500).send('Internal Server Error');
                }

                btlResults.forEach(result => {
                    result.DateOfMeet = result.formattedDate;
                    result.Manager_Approval_date = result.formattedApprovedBTLDate;
                    delete result.formattedDate;
                    delete result.formattedApprovedBTLDate;
                });

                const photoQueryForRCId = `
                    SELECT Event_Photo1,Event_Photo2,Event_Photo3 FROM Jacpl_ContractorMeet WHERE emp_id=? AND rc_id=?`;

                pool.query(photoQueryForRCId, [emp_id,rc_id], (photoErr, photoResultsForRCId) => {
                    if (photoErr) {
                        console.error(photoErr);
                        logger.error('Error in GET manage_pending_btl photoQuery ' + emp_id + photoErr + "::query::" + photoQueryForRCId);
                        return res.status(500).send('Internal Server Error');
                    }

                    // Extract last values from photoResultsForRCId
                    const lastValuesForRCId = photoResultsForRCId.map(photo => {
                        const values = [photo.Event_Photo1, photo.Event_Photo2, photo.Event_Photo3];
                        const lastParts = values.map(value => {
                            const parts = (value || '').split("-");
                            return parts[parts.length - 1];
                        });
                        return lastParts;
                    });

                    const photoQueryForEmpId = `SELECT rc_id, Event_Photo1, Event_Photo2, Event_Photo3 FROM Jacpl_ContractorMeet WHERE emp_id=? AND rc_id!=?`;
                    pool.query(photoQueryForEmpId, [emp_id, rc_id], (photoErrForEmpId, photoResultsForEmpId) => {
                        if (photoErrForEmpId) {
                            console.error(photoErrForEmpId);
                            logger.error('Error in GET manage_pending_btl photoQuery ' + emp_id + photoErrForEmpId + "::query::" + photoQueryForEmpId);
                            return res.status(500).send('Internal Server Error');
                        }

                        const duplicates = [];

                        const lastValuesForEmpId = photoResultsForEmpId.map(photo => {
                            const values = [photo.Event_Photo1, photo.Event_Photo2, photo.Event_Photo3];
                            const lastParts = values.map(value => {
                                const parts = (value || '').split("-");
                                return parts[parts.length - 1];
                            });
                            return lastParts;
                        });

                        // Check for duplicate last values
                        lastValuesForRCId.forEach((photo, index) => {
                            const isDuplicate = lastValuesForEmpId.some(parts => {
                                return parts.includes(photo[0]) || parts.includes(photo[1]) || parts.includes(photo[2]);
                            });

                            if (isDuplicate) {
                                duplicates.push({ 
                                    photo: photo, 
                                    rc_ids: [rc_id, ...photoResultsForEmpId.filter(row => {
                                        const values = [row.Event_Photo1, row.Event_Photo2, row.Event_Photo3];
                                        return values.some(value => {
                                            const parts = (value || '').split("-");
                                            return parts.includes(photo[0]) || parts.includes(photo[1]) || parts.includes(photo[2]);
                                        });
                                    }).map(row => row.rc_id)] 
                                });
                            }
                        });

                        console.log("Duplicates:", duplicates);

                        res.render('manage_pending_btl', { data: btlResults, data2: loginResults, emp_id: emp_id, rc_id: rc_id, duplicatePhotos: duplicates });
                        logger.info('Accessed GET manage_pending_btl ' + emp_id);
                    });
                });
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
        logger.error('Error GET in manage_pending_btl ' + emp_id + error);
    }
});



route.get('/view_rejected_approved_btl_pdf', (req, res) => {
    res.render('view_rejected_approved_btl_pdf')
})



route.post('/approval_btl', async (req, res) => {
    try {


        const currentDate = getCurrentDateAndTime();


        const pool = await dbConnection();
        const emp = req.session.employeeId;
        logger.info('Starting POST approval_btl ' + emp)
        let zone = req.body.zone;
        let company = req.body.company;
        let voucher = req.body.voucher;
        let rc_id = req.body.rc_id;


        let query = 'UPDATE Jacpl_ContractorMeet SET is_active = 2, ApprovedBTL_date= ?, Zone = ?, Company = ?, voucher_no = ?, Session_ID = ? WHERE rc_id = ?';
        pool.query(query, [currentDate, zone, company, voucher, emp, rc_id], function (err, result) {
            if (err) {
                res.json({ error: 'Error updating record:', });
                logger.error('Error in POST approval_btl query ' + emp + err + query)
            } else {
                // console.log('Record updated successfully:', result);
                res.json({ success: 'Record updated successfully' });
                logger.info('Accessed POST approval_btl ' + emp)
            }
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal server error');
        logger.error('Error in POST approval_btl ' + emp)
    }
});


route.post('/rejected_btl', async (req, res) => {
    try {


        const currentDate = getCurrentDateAndTime();

        const pool = await dbConnection();
        const emp = req.session.employeeId;
        const emp_Name = req.session.emp_Name;
        logger.info('Starting POST rejected_btl ')
        const remarks = req.body.remarks
        let rc_id = req.body.rc_id;
        let emp_idd = req.body.emp_idd
        let emp_nameeee = req.body.emp_nameeee
        let meetTypeText = req.body.meetTypeText
        let people_attended = req.body.people_attended



        let query = 'UPDATE Jacpl_ContractorMeet SET is_active = 3,RejectedBTL_date= ?,Session_ID = ?,Rejected_Remarks=? WHERE rc_id = ?';
        pool.query(query, [currentDate, emp, remarks, rc_id], function (err, result) {
            if (err) {
                res.json({ error: 'Error updating record:' });
                logger.error('Error in POST rejected_btl query ' + emp + err + query)

            } else {
                // console.log('Record updated successfully:', result);
                res.send({ success: 'Record updated successfully' });
                logger.info('Accessed POST rejected_btl ' + emp)

                try {
                    let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
                    pool.query(mailquery, [emp_idd], async (error, results) => {
                        if (error) throw error;

                        // console.log(results)
                        let cc1 = results[0].Emp_Email_ID
                        let cc2 = results[0].REP_MANAGER_Email_ID
                        let receiver1 = results[0].RSM_ZSM_Email_ID
                        let emp_name = results[0].EMP_NAME

                        let toAddresses = `${receiver1}`;
                        let ccAddresses = `${cc1},${cc2}`;

                        let transporter = nodemailer.createTransport({
                            host: 'jublcorp.mail.protection.outlook.com',
                            port: 25,
                            secure: false,
                            auth: {
                                user: 'g-smart.helpdesk@jubl.com',
                                pass: 'jubl@123'
                            },
                            debug: true
                        });

                        let mailOptions = {
                            from: 'g-smart.helpdesk@jubl.com',
                            to: toAddresses,
                            cc: ccAddresses,
                            subject: `${meetTypeText}`,
                            html: `<p style="font-size: 13px;font-weight: 600;color: black;">
                            Dear Team,<br><br>


                            Employee ID: ${emp_idd} Name: ${emp_nameeee} has punched ${people_attended} contractors in ${meetTypeText}.<br><br>
                            This ${meetTypeText} Rejected by ${emp}:${emp_Name} From commercial team,<br><br>



                            BTL ID: ${rc_id}<br>
                            Rejected Reason:${remarks}<br><br>
                            Thanks & Regards
                            
                        </p>`
                        };

                        try {
                            let info = await transporter.sendMail(mailOptions);
                            // console.log('Email sent: ', info.messageId);
                            return info;
                        } catch (error) {
                            console.error('Error sending email: ', error);
                            logger.error(error + ' in nodemailer')
                            throw error;
                        }
                    })


                } catch (emailError) {
                    console.error(emailError);
                    res.json({ error: 'Error sending email for approval' });
                }



            }
        });

    } catch (err) {
        console.log(err)
        logger.error('Error in POST rejected_btl ' + emp)

    }
})













route.post('/upload_account_st', async (req, res) => {
    try {
        const con = await dbConnection();
        const dataFromBody = JSON.parse(req.body.data);
        const currentDateAndTime = getCurrentDateAndTime();

        for (let i = 0; i < dataFromBody.length; i++) {
            try {
                let lineNumber = i + 1;

                let CUST_NO = dataFromBody[i].CUST_NO;
                let FIRM_NAME = dataFromBody[i].FIRM_NAME;
                let DATE = dataFromBody[i].DATE;
                let formattedDateForDatabase = moment(DATE, 'DD-MM-YYYY').format('YYYY-MM-DD');
                let COMP = dataFromBody[i].COMP;
                let TYPE = dataFromBody[i].TYPE;
                let DOC_NO = dataFromBody[i].DOC_NO;
                let REFERANCE = dataFromBody[i].REFERANCE;
                let DEBIT = parseFloat(dataFromBody[i].DEBIT);
                let CREDIT = parseFloat(dataFromBody[i].CREDIT);
                let LINE_BALANCE = parseFloat(dataFromBody[i].LINE_BALANCE);
                let CREATION_DATETIME = currentDateAndTime;

                let selectQuery = `SELECT COUNT(*) AS count FROM Account_Statement WHERE CUST_NO = ? AND DATE = ? AND DOC_NO = ?`;
                con.query(selectQuery, [CUST_NO, formattedDateForDatabase, DOC_NO], (selectErr, selectResults) => {
                    if (selectErr) {
                        console.log(selectErr);
                        logger.error(`Error occurred at line ${lineNumber} in upload account statement selectQuery ::`, selectErr);
                        res.status(500).json({ error: `Internal Server Error at line ${lineNumber}` });
                    } else {
                        if (selectResults[0].count === 0) {
                            let insertQuery = `INSERT INTO Account_Statement(CUST_NO,Firm_Name,DATE,COMP,TYPE,DOC_NO,REFERANCE,DEBIT,CREDIT,LINE_BALANCE,CREATION_DATETIME) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
                            con.query(insertQuery, [CUST_NO, FIRM_NAME, formattedDateForDatabase, COMP, TYPE, DOC_NO, REFERANCE, DEBIT, CREDIT, LINE_BALANCE, CREATION_DATETIME], (insertErr, insertResults) => {
                                if (insertErr) {
                                    console.log(insertErr);
                                    logger.error(`Error occurred at line ${lineNumber} in upload account statement insertQuery ::`, insertErr);
                                    res.status(500).json({ error: `Internal Server Error at line ${lineNumber}` });
                                } else {
                                    // console.log(insertResults);
                                }
                            });
                        } else {
                            let updateQuery = `UPDATE Account_Statement SET Firm_Name=?, COMP=?, TYPE=?, REFERANCE=?, DEBIT=?, CREDIT=?, LINE_BALANCE=?, CREATION_DATETIME=? WHERE CUST_NO=? AND DATE=? AND DOC_NO=?`;
                            con.query(updateQuery, [FIRM_NAME, COMP, TYPE, REFERANCE, DEBIT, CREDIT, LINE_BALANCE, CREATION_DATETIME, CUST_NO, formattedDateForDatabase, DOC_NO], (updateErr, updateResults) => {
                                if (updateErr) {
                                    console.log(updateErr);
                                    logger.error(`Error occurred at line ${lineNumber} in upload account statement updateQuery ::`, updateErr);
                                    res.status(500).json({ error: `Internal Server Error at line ${lineNumber}` });
                                } else {
                                    // console.log('updating same  Data ');
                                }
                            });
                        }
                    }
                });
            } catch (err) {
                console.error(`Error occurred at line ${lineNumber}:`, err);
                res.status(500).json({ error: `Internal Server Error at line ${lineNumber}` });
                logger.error(`Error occurred at line ${lineNumber}:`, err);
            }
        }

        res.status(200).json({ message: 'Data inserted or updated successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error('in upload account statement :: ', err)
    }
});













route.post('/login', async (req, res) => {
    try {

        const currentDateAndTime = getCurrentDateAndTime();
        // console.log(currentDateAndTime)


        let empId = req.body.Employeid;
        let empPassword = req.body.password;
        const pool = await dbConnection();

        let data = qs.stringify({
            'loginInfoSales': JSON.stringify({ "empId": empId, "empPassword": empPassword, "empVal": "0" })
        });
        let config = {
            method: 'post',
            url: process.env.JACPL_ATTENDED_API,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'JSESSIONID=432B7D6836A988969AFFA9B470F6DC12'
            },
            data: data
        };

        const response = await axios.request(config);

        // console.log(JSON.stringify(response.data.result));

        if (response.data.result == '1') {
            req.session.employeeId = empId;
            req.session.emp_Name = response.data.empName;
            req.session.designation = response.data.designation

            console.log(req.session.designation)
            const designation = response.data.designation

            console.log(designation, 'desingation')
            const query = `SELECT action_type,action_url FROM Jacpl_master WHERE action_value = ? AND action_status = 1`;

            pool.query(query, [designation], (err, result) => {
                if (err) {
                    console.error("Error executing SQL query:", err);
                    req.session.role = 'DefaultRole';
                } else {
                    if (result.length > 0) {
                        req.session.role = result[0].action_type;
                        let action_url = result[0].action_url



                        const branch = response.data.branch
                        const zone = response.data.zone
                        let supeviosrName = response.data.supeviosrName
                        let supeviosrId = response.data.supeviosrId
                        let zmRSMId = response.data.zmRSMId
                        let zmRSMName = response.data.zmRSMName
                        let teEmailId = response.data.teEmailId
                        let bmEmailId = response.data.bmEmailId
                        let zmEmailId = response.data.zmEmailId
                        let hqName = response.data.hqName;
                        let hqcode = response.data.hqCode;
                        let category = response.data.category;



                        let roleQuery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE = ?`;
                        pool.query(roleQuery, [empId], function (error, results, fields) {
                            if (error) {
                                console.error(error);
                                return res.status(500).send('Error executing the query');
                            }

                            if (results.length > 0) {
                                console.log(action_url, 'action_url')

                                console.log(action_url, 'action_url');

                                if (action_url === '1') {
                                    const updateQuery = `UPDATE JUBILANT_LOGIN SET ROLE=?, EMP_NAME=?,PASSWORD=?,Emp_Email_ID=?,REP_MANAGER_ID=?,REP_MANAGER_NAME=?,REP_MANAGER_Email_ID=?,RSM_ZSM_ID=?,RSM_ZSM_Name=?,RSM_ZSM_Email_ID=?,BRANCH=?,ZONE=?,L_LOGIN_DATE=?,EMP_DESI=?,EMP_HQ_NAME=?,EMP_HQ_CODE=?,EMP_VERTICAL=? WHERE EMP_CODE=?`;
                                    const updateValues = [req.session.role, req.session.emp_Name, empPassword, bmEmailId, supeviosrId, supeviosrName, zmEmailId, zmRSMId, zmRSMName, zmEmailId, branch, zone, currentDateAndTime, designation,hqName,hqcode,category, empId];
                                    pool.query(updateQuery, updateValues, function (error, results, fields) {
                                        if (error) {
                                            console.error(error);
                                            return res.status(500).send('Error updating record');
                                        } else {
                                            // console.log(results)
                                        }
                                    });
                                } else if (action_url === '2') {
                                    const updateQuery = `UPDATE JUBILANT_LOGIN SET ROLE=?, EMP_NAME=?,PASSWORD=?,Emp_Email_ID=?,REP_MANAGER_ID=?,REP_MANAGER_NAME=?,REP_MANAGER_Email_ID=?,RSM_ZSM_ID=?,RSM_ZSM_Name=?,RSM_ZSM_Email_ID=?,BRANCH=?,ZONE=?,L_LOGIN_DATE=?,EMP_DESI=?,EMP_HQ_NAME=?,EMP_HQ_CODE=?,EMP_VERTICAL=? WHERE EMP_CODE=?`;
                                    const updateValues = [req.session.role, req.session.emp_Name, empPassword, zmEmailId, supeviosrId, supeviosrName, bmEmailId, zmRSMId, zmRSMName, 'null', branch, zone, currentDateAndTime, designation,hqName,hqcode,category, empId];
                                    pool.query(updateQuery, updateValues, function (error, results, fields) {
                                        if (error) {
                                            console.error(error);
                                            return res.status(500).send('Error updating record');
                                        } else {
                                            // console.log(results)
                                        }
                                    });
                                } else {
                                    const updateQuery = `UPDATE JUBILANT_LOGIN SET ROLE=?, EMP_NAME=?,PASSWORD=?,Emp_Email_ID=?,REP_MANAGER_ID=?,REP_MANAGER_NAME=?,REP_MANAGER_Email_ID=?,RSM_ZSM_ID=?,RSM_ZSM_Name=?,RSM_ZSM_Email_ID=?,BRANCH=?,ZONE=?,L_LOGIN_DATE=?,EMP_DESI=?,EMP_HQ_NAME=?,EMP_HQ_CODE=?,EMP_VERTICAL=? WHERE EMP_CODE=?`;
                                    const updateValues = [req.session.role, req.session.emp_Name, empPassword, teEmailId, supeviosrId, supeviosrName, bmEmailId, zmRSMId, zmRSMName, zmEmailId, branch, zone, currentDateAndTime, designation,hqName,hqcode,category, empId];
                                    pool.query(updateQuery, updateValues, function (error, results, fields) {
                                        if (error) {
                                            console.error(error);
                                            return res.status(500).send('Error updating record');
                                        } else {
                                            // console.log(results)
                                        }
                                    });
                                }

                            } else {


                                if (action_url === '1') {
                                    const insertQuery = `INSERT INTO JUBILANT_LOGIN (EMP_CODE, ROLE, EMP_NAME, PASSWORD ,F_LOGIN_DATE ,EMP_DESI,BRANCH,ZONE,Emp_Email_ID,REP_MANAGER_ID,REP_MANAGER_NAME,REP_MANAGER_Email_ID,RSM_ZSM_ID,RSM_ZSM_Name,RSM_ZSM_Email_ID,EMP_HQ_NAME,EMP_HQ_CODE,EMP_VERTICAL,EMP_HQ_NAME,EMP_HQ_CODE,EMP_VERTICAL) VALUES (?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                                    const insertValues = [empId, req.session.role, req.session.emp_Name, empPassword, currentDateAndTime, designation, branch, zone, bmEmailId, supeviosrId, supeviosrName, zmEmailId, zmRSMId, zmRSMName, zmEmailId,hqName,hqcode,category];
                                    pool.query(insertQuery, insertValues, function (error, results, fields) {
                                        if (error) {
                                            console.error(error);
                                            return res.status(500).send('Error inserting record');
                                        } else {
                                            // console.log(results)
                                        }
                                    });
                                } else if (action_url === '2') {
                                    const insertQuery = `INSERT INTO JUBILANT_LOGIN (EMP_CODE, ROLE, EMP_NAME, PASSWORD ,F_LOGIN_DATE ,EMP_DESI,BRANCH,ZONE,Emp_Email_ID,REP_MANAGER_ID,REP_MANAGER_NAME,REP_MANAGER_Email_ID,RSM_ZSM_ID,RSM_ZSM_Name,RSM_ZSM_Email_ID,EMP_HQ_NAME,EMP_HQ_CODE,EMP_VERTICAL) VALUES (?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?)`;
                                    const insertValues = [empId, req.session.role, req.session.emp_Name, empPassword, currentDateAndTime, designation, branch, zone, zmEmailId, supeviosrId, supeviosrName, bmEmailId, zmRSMId, zmRSMName, 'null',hqName,hqcode,category];
                                    pool.query(insertQuery, insertValues, function (error, results, fields) {
                                        if (error) {
                                            console.error(error);
                                            return res.status(500).send('Error inserting record');
                                        } else {
                                            // console.log(results)
                                        }
                                    });
                                } else {
                                    const insertQuery = `INSERT INTO JUBILANT_LOGIN (EMP_CODE, ROLE, EMP_NAME, PASSWORD ,F_LOGIN_DATE ,EMP_DESI,BRANCH,ZONE,Emp_Email_ID,REP_MANAGER_ID,REP_MANAGER_NAME,REP_MANAGER_Email_ID,RSM_ZSM_ID,RSM_ZSM_Name,RSM_ZSM_Email_ID,EMP_HQ_NAME,EMP_HQ_CODE,EMP_VERTICAL) VALUES (?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                                    const insertValues = [empId, req.session.role, req.session.emp_Name, empPassword, currentDateAndTime, designation, branch, zone, teEmailId, supeviosrId, supeviosrName, bmEmailId, zmRSMId, zmRSMName, zmEmailId,hqName,hqcode,category];
                                    pool.query(insertQuery, insertValues, function (error, results, fields) {
                                        if (error) {
                                            console.error(error);
                                            return res.status(500).send('Error inserting record');
                                        } else {
                                            // console.log(results)
                                        }
                                    });
                                }

                            }
                        });


                        if (req.session.role === 'EMPLOYEE') {
                            res.json({ redirect: '/employee_dashboard' });
                        } else if (req.session.role === 'MANAGER') {
                            res.json({ redirect: '/manager_dashboard' });
                        } else {
                            res.json({ redirect: '/' });
                        }

                    } else {
                        req.session.role = 'DefaultRole';
                    }
                }
            });


        } else {

            let roleQuery = `SELECT ROLE, EMP_NAME, PASSWORD,EMP_DESI FROM JUBILANT_LOGIN WHERE EMP_CODE = ?`;
            pool.query(roleQuery, [empId], function (error, results, fields) {
                if (results.length > 0) {
                    const role = results[0].ROLE || 'DefaultRole';
                    req.session.emp_Name = results[0].EMP_NAME;
                    const storedPassword = results[0].PASSWORD;
                    req.session.employeeId = empId;
                    req.session.role = role;
                    req.session.designation = results[0].EMP_DESI

                    console.log(req.session.designation)



                    if (empPassword == storedPassword) {
                        req.session.role = role;

                        let redirectUrl;
                        switch (role) {
                            case 'ADMIN':
                                redirectUrl = '/admin_dashboard';
                                break;
                            case 'COMMERCIAL':
                                redirectUrl = '/commercial_dashboard';
                                break;
                            case 'SUPER_ADMIN':
                                redirectUrl = '/super_admin_dashboard';
                                break;
                            default:
                                redirectUrl = '/';
                                break;
                        }
                        res.json({ redirect: redirectUrl });


                        let selectQuery = `SELECT F_LOGIN_DATE FROM JUBILANT_LOGIN WHERE EMP_CODE = ?`;

                        pool.query(selectQuery, [empId], function (err, results) {
                            if (err) {
                                console.log(err);
                                logger.error(err);
                            }

                            if (results.length > 0 && results[0].F_LOGIN_DATE !== null) {
                                let updateQuery = `UPDATE JUBILANT_LOGIN SET L_LOGIN_DATE = ? WHERE EMP_CODE = ?`;
                                pool.query(updateQuery, [currentDateAndTime, empId], (err, result) => {
                                    if (err) throw err;
                                    logger.error(err);
                                });
                            } else {
                                let insertQuery = `UPDATE JUBILANT_LOGIN SET F_LOGIN_DATE= ? WHERE EMP_CODE = ?`;
                                pool.query(insertQuery, [currentDateAndTime, empId], (err, result) => {
                                    if (err) throw err;
                                    logger.error(err);
                                });
                            }
                        });






                    } else {
                        req.session.role = 'DefaultRole';
                        res.json({ passwordError: 'Invalid Password' });
                    }
                } else {
                    req.session.role = 'DefaultRole';
                    res.json({ usernameError: 'Invalid Employee ID' });
                }

            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
        logger.error(error + ' in login');
    }
});










const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/var/log/jubilant/images');
    },
    filename: (req, file, cb) => {
        // Generate a unique filename here
        const uniqueFilename = uuidv4() + '-' + file.originalname;
       
        cb(null, uniqueFilename);
    },
});


const upload = multer({ storage: storage });


// route.post('/in-shope', upload.fields([
//     { name: 'Attachment1', maxCount: 1 },
//     { name: 'Attachment2', maxCount: 1 },
//     { name: 'Attachment3', maxCount: 1 },
// ]), async function (req, res) {
//     try {
//         const currentDateAndTime = getCurrentDateAndTime();



//         let email_send = req.body.email_to_send;

//         const uniqueFilename1 = req.files.Attachment1[0].filename;
//         const uniqueFilename2 = req.files.Attachment2[0].filename;
//         const uniqueFilename3 = req.files.Attachment3[0].filename;
    
//         let emp_code = req.body.employeeId
        
//         let dealer_code = req.body.dealercode;
//         let dealer_firmname = req.body.dealerfirmname;
//         let dealer_name = req.body.dealername;
//         let mobile_number = req.body.mobilenumber;
        
//         let city = req.body.city;
//         let agendaLines = req.body.Agenda.split('\n');
//         let agenda = agendaLines.join(' ');
//         let outcomeLines = req.body.Outcome.split('\n');
//         let outcome = outcomeLines.join(' ');
//         let dateformate = req.body.dateformate;
//         formattedDateForDatabase = moment(dateformate, 'DD-MM-YYYY').format('YYYY-MM-DD');
//         let vertical = req.body.vertical;
//         let Meeting = req.body.Meeting;
//         let count = req.body.count;
//         let countemp = req.body.countemp;
//         let countade = req.body.countade;
//         let number = req.body.number;
//         let numberemp = req.body.numberemp;
//         let numberade = req.body.numberade;
//         console.log(numberade,'numberade')
//         let expense = req.body.expense;
//         const additionalInfo = req.body.additionalInfo; 
//         let budget = req.body.budget;
//         let { cal, cal1, cal2 } = req.body;
//         let concatenatedValue = `${cal2} + ${cal1} + ${cal}`;

//         console.log("2 in in--shope meet")
//         logger.info("2 in in--shope")


//         const pool = await dbConnection();

//         let is_active = (email_send === 'Yes') ? '0' : '1';


//         let insertQuery = `
//             INSERT INTO Jacpl_ContractorMeet (emp_id, dateofmeet, dealer_code, dealer_firm_name, dealer_name, dealer_mobile, city, agenda, jacpl_attended, cond_by, outcome, vertical, meeting_gift, meet_type, event_photo1,event_photo2,event_photo3,attended_count,MobileAttended,expense,Budget,Jacpl_Attended_count,ADE_Attended_count,Budget_brief,creation_dtm,is_active,pay_advance)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//         `;

//         pool.query(insertQuery, [emp_code, formattedDateForDatabase, dealer_code, dealer_firmname, dealer_name, mobile_number, city, agenda, numberemp, numberade, outcome, vertical, Meeting, '1', uniqueFilename1, uniqueFilename2,uniqueFilename3, count, number, expense, budget, countemp, countade, concatenatedValue, currentDateAndTime, is_active,additionalInfo], (error, results) => {
//             console.log(results, 'results')
//             if (error) {
//                 console.log(error);
//                 logger.error(error)
//                 res.json({ error: 'Internal Server Error' });
//             } else {

//                 console.log("3 in in--shope meet")
//                 logger.info("3 in in--shope")
//                 let rc_query = `SELECT rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1;`
//                 pool.query(rc_query, (err, rc_results) => {
//                     rc_id = rc_results[0].rc_id
//                     if (email_send === 'Yes') {
//                         try {
//                             let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
//                             pool.query(mailquery, [emp_code], async (error, results) => {
//                                 if (error){
//                                     console.log(error)
//                                     logger.error(error)
//                                 }

//                                 // console.log(results)
//                                 let cc1 = results[0].RSM_ZSM_Email_ID
//                                 let receiver1 = results[0].REP_MANAGER_Email_ID
//                                 let emp_name = results[0].EMP_NAME

//                                 let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
//                                 // let RSM_ZSM_Name = results[0].RSM_ZSM_Name

//                                 let toAddresses = `${receiver1}`;
//                                 let ccAddresses = `${cc1}`;

//                                 let transporter = nodemailer.createTransport({
//                                     host: 'jublcorp.mail.protection.outlook.com',
//                                     port: 25,
//                                     secure: false,
//                                     auth: {
//                                         user: 'g-smart.helpdesk@jubl.com',
//                                         pass: 'jubl@123'
//                                     },
//                                     debug: true
//                                 });

//                                 let mailOptions = {
//                                     from: 'g-smart.helpdesk@jubl.com',
//                                     to: toAddresses,
//                                     // to: 'bhavishya.chauhan@manthanitsolutions.in',
//                                     cc: ccAddresses,
//                                     subject: 'InShop Meet Approval',
//                                     html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>

                                 
 
//                                 Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} contractors in InShop Meet hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
//                                BTL ID: ${rc_id}<br>
                    
//                                         JACPL Employee Count: ${countemp}<br>
                    
//                                         ADE Employee Count: ${countade}<br>
                    
//                                         Budget Brife: ${concatenatedValue}<br>
                    
//                                         BTL Advance Amount: ${additionalInfo}<br>
                    
//                                         Allocated Budget: ${budget}<br>
                    
//                                         Total Expense: ${expense}<br>

//                                 <table border="0" cellspacing="0" cellpadding="0">
//                                 <tr>
//                                     <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
//                                         <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_APPROVE}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
//                                     </td>
                            
//                                     <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
//                                     <td>&nbsp;</td>
                            
//                                     <td align="center" style="border-radius: 5px; background-color: #cc0001;">
//                                     <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_REJECT}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
//                                 </td>
//                                 </tr>
//                             </table>

//                                 <br><br>
                                 
//                                 Regards,
//                                 </p>`
//                                 };

//                                 try {
//                                     let info = await transporter.sendMail(mailOptions);
//                                     res.json({ message: `Email sent for approval with ID ${rc_id}`, number: number });
//                                     // console.log('Email sent: ', info.messageId);

//                                     console.log("4 in in--shope meet")
//                                     logger.info("4 in in--shope")
//                                     return info;
//                                 } catch (error) {
//                                     console.log('Error sending email: ', error);
//                                     logger.error(error + ' in nodemailer')
//                                     throw error;
//                                 }
//                             })

//                         } catch (emailError) {
//                             console.log(emailError);
//                             logger.log(emailError)
//                             res.json({ error: 'Error sending email for approval' });
//                         }
//                     } else {
//                         res.json({ message: `Inshop detail successfully submitted  with ID ${rc_id}`, number: number });
//                     }

//                     if (expense > budget) {

                       

//                         console.log('11111')
//                         const transporter = nodemailer.createTransport({
//                             service: 'gmail', 
//                             auth: {
//                                  user: 'vishal.manthanitsolutions@gmail.com',
//                                   pass: 'yjal dkyp ncld juil'
//                             }
//                         });
                        
//                         const mailOption1 = {
//                             from: 'vishal.manthanitsolutions@gmail.com',
//                             to: 'yogeshmanthanitsolution@gmail.com',
//                             cc: 'ramkeshn311@gmail.com',
//                             subject: 'Expense Exceeds Budget',
//                                 html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>
//                                         Employee ID: ${emp_code} Name: ${emp_name} has punched 16 Contractors/Dealers in SGA Meet and Expense amount greater than the allocated budget hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                                     
//                                         BTL ID: ${rc_id}<br>
                    
//                                         JACPL Employee Count: ${countemp}<br>
                    
//                                         ADE Employee Count: ${countade}<br>
                    
//                                         Budget Brife: ${concatenatedValue}<br>
                    
//                                         BTL Advance Amount: ${additionalInfo}<br>
                    
//                                         Allocated Budget: ${budget}<br>
                    
//                                         Total Expense: ${expense}<br>
                    
//                                         Kindly find the enclosed attached meeting pics, Hotel & Food bill & Gift bill.<br>
                    
//                                         Note: BTL & Expense approve & Reject by ZSM/RSM only.<br>
                    
//                                         <table border="0" cellspacing="0" cellpadding="0">
//                                         <tr>
//                                             <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
//                                                 <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_APPROVE}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
//                                             </td>
                                    
//                                             <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
//                                             <td>&nbsp;</td>
                                    
//                                             <td align="center" style="border-radius: 5px; background-color: #cc0001;">
//                                             <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_REJECT}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
//                                         </td>
//                                         </tr>
//                                     </table>
                    
//                                 <br><br>
                                    
//                                 Regards,
//                                 </p>`
//                              };
                    
                                                  
                     
                    
//                         transporter.sendMail(mailOption1, (error, info) => {
//                             if (error) {
//                                 return res.status(500).send(error.toString());
//                             }
//                             res.status(200).send('Email sent: ' + info.response);
//                         });

                     
//                     }



//                 })

//             }


//             let selectQuery = `SELECT MobileAttended, creation_dtm, rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1`;

//             pool.query(selectQuery, function (error, results, fields) {
//                 console.log(results,'results')
//                 if (error) {
//                     console.log(error);
//                     logger.error(error)

//                     return;
//                 }

//                 for (let i = 0; i < results.length; i++) {
//                     let rc_id = results[i].rc_id;
//                     let creation_dtm = results[i].creation_dtm
//                     let mobile_numbers = results[i].MobileAttended;

//                     let values = mobile_numbers.split(',');

                  
//                     let numbersArray = values.map(item => {
//                         let pair = item.split(':');
//                         return { mobile: pair[0].trim(), gift: pair[1].trim() }; 
//                     });

                 

                    
//                     numbersArray.forEach(function (userData) {
//                         let insertQuery = `INSERT INTO Jacpl_ContractorMeetDetails (rc_id, Inf_Mobile, creation_dtm, gift_name) VALUES (?,?,?,?)`;
//                         pool.query(insertQuery, [rc_id, userData.mobile, creation_dtm, userData.gift], function (insertError, insertResults) {
                           
//                             if (insertError) {
//                                 console.log(insertError);
//                                 logger.error(insertError);
//                             } else {
//                                 console.log("Insert successful for rc_id:", rc_id);
//                                 logger.info("Insert successful for rc_id:", rc_id);
//                             }
//                         });
//                     });
//                 }
//             });
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });



route.post('/in-shope', upload.fields([
    { name: 'Attachment1', maxCount: 1 },
    { name: 'Attachment2', maxCount: 1 },
    { name: 'Attachment3', maxCount: 1 },
]), async function (req, res) {
    try {
        const currentDateAndTime = getCurrentDateAndTime();



        let email_send = req.body.email_to_send;

    
 let { Attachment1 = [], Attachment2 = [], Attachment3 = [] } = req.files;
    
        let emp_code = req.body.employeeId
        
        let dealer_code = req.body.dealercode;
        let dealer_firmname = req.body.dealerfirmname;
        let dealer_name = req.body.dealername;
        let mobile_number = req.body.mobilenumber;
        
        let city = req.body.city;
        let agendaLines = req.body.Agenda.split('\n');
        let agenda = agendaLines.join(' ');
        let outcomeLines = req.body.Outcome.split('\n');
        let outcome = outcomeLines.join(' ');
        let dateformate = req.body.dateformate;
        formattedDateForDatabase = moment(dateformate, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let vertical = req.body.vertical;
        let Meeting = req.body.Meeting;
        let count = req.body.count;
        let countemp = req.body.countemp;
        let countade = req.body.countade;
        let number = req.body.number;
        let numberemp = req.body.numberemp;
        let numberade = req.body.numberade;
        console.log(numberade,'numberade')
        let expense = req.body.expense;
        const additionalInfo = req.body.additionalInfo; 
        let budget = req.body.budget;
        let { cal, cal1, cal2 } = req.body;
        let concatenatedValue = `${cal2} + ${cal1} + ${cal}`;

        console.log("2 in in--shope meet")
        logger.info("2 in in--shope")


        const pool = await dbConnection();

        let is_active = (email_send === 'Yes') ? '0' : '1';


        let insertQuery = `
            INSERT INTO Jacpl_ContractorMeet (emp_id, dateofmeet, dealer_code, dealer_firm_name, dealer_name, dealer_mobile, city, agenda, jacpl_attended, cond_by, outcome, vertical, meeting_gift, meet_type, event_photo1,event_photo2,event_photo3,attended_count,MobileAttended,expense,Budget,Jacpl_Attended_count,ADE_Attended_count,Budget_brief,creation_dtm,is_active,pay_advance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        pool.query(insertQuery, [emp_code, formattedDateForDatabase, dealer_code, dealer_firmname, dealer_name, mobile_number, city, agenda, numberemp, numberade, outcome, vertical, Meeting, '1',  Attachment1.length > 0 ? Attachment1[0].filename : '', Attachment2.length > 0 ? Attachment2[0].filename : '',
            Attachment3.length > 0 ? Attachment3[0].filename : '', count, number, expense, budget, countemp, countade, concatenatedValue, currentDateAndTime, is_active,additionalInfo], (error, results) => {
            console.log(results, 'results')
            if (error) {
                console.log(error);
                logger.error(error)
                res.json({ error: 'Internal Server Error' });
            } else {

                console.log("3 in in--shope meet")
                logger.info("3 in in--shope")
                let rc_query = `SELECT rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1;`
                pool.query(rc_query, (err, rc_results) => {
                    rc_id = rc_results[0].rc_id
                    if (email_send === 'Yes') {
                        try {
                            let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
                            pool.query(mailquery, [emp_code], async (error, results) => {
                                if (error){
                                    console.log(error)
                                    logger.error(error)
                                }

                                // console.log(results)
                                let cc1 = results[0].RSM_ZSM_Email_ID
                                let receiver1 = results[0].REP_MANAGER_Email_ID
                                let emp_name = results[0].EMP_NAME

                                let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
                                // let RSM_ZSM_Name = results[0].RSM_ZSM_Name

                                let toAddresses = `${receiver1}`;
                                let ccAddresses = `${cc1}`;

                                let transporter = nodemailer.createTransport({
                                    host: 'jublcorp.mail.protection.outlook.com',
                                    port: 25,
                                    secure: false,
                                    auth: {
                                        user: 'g-smart.helpdesk@jubl.com',
                                        pass: 'jubl@123'
                                    },
                                    debug: true
                                });

                                let mailOptions = {
                                    from: 'g-smart.helpdesk@jubl.com',
                                    to: toAddresses,
                                    // to: 'bhavishya.chauhan@manthanitsolutions.in',
                                    cc: ccAddresses,
                                    subject: 'InShop Meet Approval',
                                    html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>

                                 
 
                                Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} contractors in InShop Meet hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                               BTL ID: ${rc_id}<br>
                    
                                        JACPL Employee Count: ${countemp}<br>
                    
                                        ADE Employee Count: ${countade}<br>
                    
                                        Budget Brife: ${concatenatedValue}<br>
                    
                                        BTL Advance Amount: ${additionalInfo}<br>
                    
                                        Allocated Budget: ${budget}<br>
                    
                                        Total Expense: ${expense}<br>

                                           <br>
                    
                                        Note: BTL & Expense approve & Reject by BM/ASM/TM/BDM/TSS only.<br>

                                <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                        <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_APPROVE}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                    </td>
                            
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td>&nbsp;</td>
                            
                                    <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                    <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_REJECT}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                </td>
                                </tr>
                            </table>

                                <br><br>
                                 
                                Regards,
                                </p>`
                                };

                                try {
                                    let info = await transporter.sendMail(mailOptions);
                                    res.json({ message: `Email sent for approval with ID ${rc_id}`, number: number });
                                    // console.log('Email sent: ', info.messageId);

                                    console.log("4 in in--shope meet")
                                    logger.info("4 in in--shope")
                                    return info;
                                } catch (error) {
                                    console.log('Error sending email: ', error);
                                    logger.error(error + ' in nodemailer')
                                    throw error;
                                }
                            })

                        } catch (emailError) {
                            console.log(emailError);
                            logger.log(emailError)
                            res.json({ error: 'Error sending email for approval' });
                        }
                    } else {
                        res.json({ message: `Inshop detail successfully submitted  with ID ${rc_id}`, number: number });
                    }

                    if (expense > budget) {


                        let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
                        pool.query(mailquery, [emp_code], async (error, results) => {
                            if (error){
                                console.log(error)
                                logger.error(error)
                            }

                       
                            let cc1 = results[0].RSM_ZSM_Email_ID
                            let receiver1 = results[0].REP_MANAGER_Email_ID
                            let emp_name = results[0].EMP_NAME

                            let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
                         

                            let toAddresses = `${receiver1}`;
                            let ccAddresses = `${cc1}`;

                        

                        console.log('11111')
                        const transporter = nodemailer.createTransport({
                            service: 'gmail', 
                            auth: {
                                 user: 'vishal.manthanitsolutions@gmail.com',
                                  pass: 'yjal dkyp ncld juil'
                            }
                        });
                        
                        const mailOption1 = {
                            from: 'vishal.manthanitsolutions@gmail.com',
                            to: 'yogeshmanthanitsolution@gmail.com',
                            cc: 'ramkeshn311@gmail.com',
                            subject: 'InShop Meet Budget Exceeds',
                                html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>
                                        Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} Contractors/Dealers in SGA Meet and Expense amount greater than the allocated budget hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                                     
                                        BTL ID: ${rc_id}<br>
                    
                                        JACPL Employee Count: ${countemp}<br>
                    
                                        ADE Employee Count: ${countade}<br>
                    
                                        Budget Brife: ${concatenatedValue}<br>
                    
                                        BTL Advance Amount: ${additionalInfo}<br>
                    
                                        Allocated Budget: ${budget}<br>
                    
                                        Total Expense: ${expense}<br>
                    
                                      <br>

                                        Note: BTL & Expense approve & Reject by ZSM/RSM only.<br>
                    
                                        <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                                <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_APPROVE}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                            </td>
                                    
                                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                            <td>&nbsp;</td>
                                    
                                            <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                            <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_REJECT}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                        </td>
                                        </tr>
                                    </table>
                    
                                <br><br>
                                    
                                Regards,
                                </p>`
                             };
                    
                                                  
                     
                    
                        transporter.sendMail(mailOption1, (error, info) => {
                            if (error) {
                                return res.status(500).send(error.toString());
                            }
                            res.status(200).send('Email sent: ' + info.response);
                        });

                    });

                     
                    }



                })

            }


            let selectQuery = `SELECT MobileAttended, creation_dtm, rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1`;

            pool.query(selectQuery, function (error, results, fields) {
                console.log(results,'results')
                if (error) {
                    console.log(error);
                    logger.error(error)

                    return;
                }

                for (let i = 0; i < results.length; i++) {
                    let rc_id = results[i].rc_id;
                    let creation_dtm = results[i].creation_dtm
                    let mobile_numbers = results[i].MobileAttended;

                    let values = mobile_numbers.split(',');

                  
                    let numbersArray = values.map(item => {
                        let pair = item.split(':');
                        return { mobile: pair[0].trim(), gift: pair[1].trim() }; 
                    });

                 

                    
                    numbersArray.forEach(function (userData) {
                        let insertQuery = `INSERT INTO Jacpl_ContractorMeetDetails (rc_id, Inf_Mobile, creation_dtm, gift_name) VALUES (?,?,?,?)`;
                        pool.query(insertQuery, [rc_id, userData.mobile, creation_dtm, userData.gift], function (insertError, insertResults) {
                           
                            if (insertError) {
                                console.log(insertError);
                                logger.error(insertError);
                            } else {
                                console.log("Insert successful for rc_id:", rc_id);
                                logger.info("Insert successful for rc_id:", rc_id);
                            }
                        });
                    });
                }
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




route.post('/contractor_meet', upload.fields([
    { name: 'Attachment1', maxCount: 1 },
    { name: 'Attachment2', maxCount: 1 },
    { name: 'Attachment3', maxCount: 1 },
]), async function (req, res) {
    try {
        const currentDateAndTime = getCurrentDateAndTime();


        let email_send = req.body.email_to_send;


        let { Attachment1 = [], Attachment2 = [], Attachment3 = [] } = req.files;

        let emp_code = req.body.employeeId
        let dealer_code = req.body.dealercode;
        let dealer_firmname = req.body.dealerfirmname;
        let dealer_name = req.body.dealername;
        let mobile_number = req.body.mobilenumber;
        let city = req.body.city;
        let agendaLines = req.body.Agenda.split('\n');
        let agenda = agendaLines.join(' ');
        let outcomeLines = req.body.Outcome.split('\n');
        let outcome = outcomeLines.join(' ');
        let dateformate = req.body.dateformate;
        formattedDateForDatabase = moment(dateformate, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let vertical = req.body.vertical;
        let Meeting = req.body.Meeting;
        let count = req.body.count;
        let countemp = req.body.countemp;
        let countade = req.body.countade;
        let number = req.body.number;
        let numberemp = req.body.numberemp;
        let numberade = req.body.numberade;
        let expense = req.body.expense;
        let budget = req.body.budget;
        const additionalInfo = req.body.additionalInfo; 
        let { cal, cal1, cal2 } = req.body;
        let concatenatedValue = `${cal2} + ${cal1} + ${cal}`;





        const pool = await dbConnection();
        let is_active = (email_send === 'Yes') ? '0' : '1';

        let insertQuery = `
            INSERT INTO Jacpl_ContractorMeet (emp_id, dateofmeet, dealer_code, dealer_firm_name, dealer_name, dealer_mobile, city, agenda, jacpl_attended, cond_by, outcome, vertical, meeting_gift, meet_type, event_photo1,event_photo2,event_photo3,attended_count,MobileAttended,expense,Budget,Jacpl_Attended_count,ADE_Attended_count,Budget_brief,creation_dtm,is_active,pay_advance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        pool.query(insertQuery, [emp_code, formattedDateForDatabase, dealer_code, dealer_firmname, dealer_name, mobile_number, city, agenda, numberemp, numberade, outcome, vertical, Meeting, '2',Attachment1.length > 0 ? Attachment1[0].filename : '', Attachment2.length > 0 ? Attachment2[0].filename : '',Attachment3.length > 0 ? Attachment3[0].filename : '', count, number, expense, budget, countemp, countade, concatenatedValue, currentDateAndTime, is_active,additionalInfo], (error, results) => {
            // console.log(results, 'results')
            if (error) {
                console.error(error);
                res.json({ error: 'Internal Server Error' });
            } else {
                let rc_query = `SELECT rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1;`
                pool.query(rc_query, (err, rc_results) => {
                    rc_id = rc_results[0].rc_id
                    if (email_send === 'Yes') {
                        try {
                            let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
                            pool.query(mailquery, [emp_code], async (error, results) => {
                                if (error) throw error;

                                // console.log(results)
                                let cc1 = results[0].RSM_ZSM_Email_ID
                                let receiver1 = results[0].REP_MANAGER_Email_ID
                                let emp_name = results[0].EMP_NAME

                                let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
                                // let RSM_ZSM_Name = results[0].RSM_ZSM_Name

                                let toAddresses = `${receiver1}`;
                                let ccAddresses = `${cc1}`;

                                let transporter = nodemailer.createTransport({
                                    host: 'jublcorp.mail.protection.outlook.com',
                                    port: 25,
                                    secure: false,
                                    auth: {
                                        user: 'g-smart.helpdesk@jubl.com',
                                        pass: 'jubl@123'
                                    },
                                    debug: true
                                });

                                let mailOptions = {
                                    from: 'g-smart.helpdesk@jubl.com',
                                    to: toAddresses,
                                    cc: ccAddresses,
                                    subject: 'Contractor Meet Approval',
                                    html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>

                                 
 
                                Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} contractors in Contractor Meet hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                 
                               BTL ID: ${rc_id}<br>
                    
                                        JACPL Employee Count: ${countemp}<br>
                    
                                        ADE Employee Count: ${countade}<br>
                    
                                        Budget Brife: ${concatenatedValue}<br>
                    
                                        BTL Advance Amount: ${additionalInfo}<br>
                    
                                        Allocated Budget: ${budget}<br>
                    
                                        Total Expense: ${expense}<br>

                                         <br>
                    
                                        Note: BTL & Expense approve & Reject by BM/ASM/TM/BDM/TSS only.<br>

                                <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                        <a rel="noopener" target="_blank" href="${process.env.CONTRACTOR_MAIL_APPROVE}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                    </td>
                            
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td>&nbsp;</td>
                            
                                    <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                    <a rel="noopener" target="_blank" href="${process.env.CONTRACTOR_MAIL_REJECT}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                </td>
                                </tr>
                            </table>

                                <br><br>
                                 
                                Regards,
                                </p>`
                                };
                                try {
                                    let info = await transporter.sendMail(mailOptions);
                                    res.json({ message: `Email sent for approval with ID ${rc_id}`, number: number });
                                    // console.log('Email sent: ', info.messageId);
                                    return info;
                                } catch (error) {
                                    console.error('Error sending email: ', error);
                                    logger.error(error + ' in nodemailer')
                                    throw error;
                                }
                            })

                        } catch (emailError) {
                            console.error(emailError);
                            res.json({ error: 'Error sending email for approval' });
                        }
                    } else {
                        res.json({ message: `Contractor detail successfully submitted  with ID ${rc_id}`, number: number });
                    }

                    if (expense > budget) {

                        let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
                            pool.query(mailquery, [emp_code], async (error, results) => {
                                if (error) throw error;

                                // console.log(results)
                                let cc1 = results[0].RSM_ZSM_Email_ID
                                let receiver1 = results[0].REP_MANAGER_Email_ID
                                let emp_name = results[0].EMP_NAME

                                let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
                                // let RSM_ZSM_Name = results[0].RSM_ZSM_Name

                                let toAddresses = `${receiver1}`;
                                let ccAddresses = `${cc1}`;

                        console.log('11111')
                        const transporter = nodemailer.createTransport({
                            service: 'gmail', 
                            auth: {
                                 user: 'vishal.manthanitsolutions@gmail.com',
                                  pass: 'yjal dkyp ncld juil'
                            }
                        });
                        
                        const mailOption1 = {
                            from: 'vishal.manthanitsolutions@gmail.com',
                            to: 'yogeshmanthanitsolution@gmail.com',
                            cc: 'ramkeshn311@gmail.com',
                            subject: 'Contractor Meet Budget Exceeds ',
                                html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>
                                        Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} Contractors/Dealers in SGA Meet and Expense amount greater than the allocated budget hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                                     
                                        BTL ID: ${rc_id}<br>
                    
                                        JACPL Employee Count: ${countemp}<br>
                    
                                        ADE Employee Count: ${countade}<br>
                    
                                        Budget Brife: ${concatenatedValue}<br>
                    
                                        BTL Advance Amount: ${additionalInfo}<br>
                    
                                        Allocated Budget: ${budget}<br>
                    
                                        Total Expense: ${expense}<br>
                    
                                       <br>
                    
                                        Note: BTL & Expense approve & Reject by ZSM/RSM only.<br>
                    
                                        <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                                <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_APPROVE}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                            </td>
                                    
                                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                            <td>&nbsp;</td>
                                    
                                            <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                            <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_REJECT}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                        </td>
                                        </tr>
                                    </table>
                    
                                <br><br>
                                    
                                Regards,
                                </p>`
                             };
                    
                                                  
                     
                    
                        transporter.sendMail(mailOption1, (error, info) => {
                            if (error) {
                                return res.status(500).send(error.toString());
                            }
                            res.status(200).send('Email sent: ' + info.response);
                        });

                    })
                    }
                })

            }


            let selectQuery = `SELECT MobileAttended, creation_dtm, rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1`;

            pool.query(selectQuery, function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return;
                }

                for (let i = 0; i < results.length; i++) {
                    let rc_id = results[i].rc_id;
                    let creation_dtm = results[i].creation_dtm
                    let mobile_numbers = results[i].MobileAttended;
                    let values = mobile_numbers.split(',');

                  
                    let numbersArray = values.map(item => {
                        let pair = item.split(':');
                        return { mobile: pair[0].trim(), gift: pair[1].trim() }; 
                    });

                    
                    numbersArray.forEach(function (userData) {
                        let insertQuery = `INSERT INTO Jacpl_ContractorMeetDetails (rc_id, Inf_Mobile, creation_dtm, gift_name) VALUES (?,?,?,?)`;
                        pool.query(insertQuery, [rc_id, userData.mobile, creation_dtm, userData.gift], function (insertError, insertResults) {
                           
                            if (insertError) {
                                console.log(insertError);
                                logger.error(insertError);
                            } else {
                                console.log("Insert successful for rc_id:", rc_id);
                                logger.info("Insert successful for rc_id:", rc_id);
                            }
                        });
                    });
                }
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});





route.post('/dealer_meet', upload.fields([
    { name: 'Attachment1', maxCount: 1 },
    { name: 'Attachment2', maxCount: 1 },
    { name: 'Attachment3', maxCount: 1 },
]), async function (req, res) {
    try {

        const currentDateAndTime = getCurrentDateAndTime();

        let email_send = req.body.email_to_send;
        let { Attachment1 = [], Attachment2 = [], Attachment3 = [] } = req.files;

        let emp_code = req.body.employeeId
        let dealer_firmname = req.body.dealerfirmname;
        let dealer_name = req.body.dealername;
        let mobile_number = req.body.mobilenumber;
        let city = req.body.city;
        let agendaLines = req.body.Agenda.split('\n');
        let agenda = agendaLines.join(' ');
        let outcomeLines = req.body.Outcome.split('\n');
        let outcome = outcomeLines.join(' ');
        let dateformate = req.body.dateformate;
        formattedDateForDatabase = moment(dateformate, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let vertical = req.body.vertical;
        let Meeting = req.body.Meeting;
        let count = req.body.count;
        let countemp = req.body.countemp;
        let countade = req.body.countade;
        let number = req.body.number;
        let numberemp = req.body.numberemp;
        let numberade = req.body.numberade;
        let expense = req.body.expense;
        let budget = req.body.budget;
        const additionalInfo = req.body.additionalInfo; 
       
        let { cal, cal1, cal2 } = req.body;
       
        let concatenatedValue = `${cal2} + ${cal1} + ${cal}`;




        const pool = await dbConnection();
        let is_active = (email_send === 'Yes') ? '0' : '1';

        let insertQuery = `
            INSERT INTO Jacpl_ContractorMeet (emp_id, dateofmeet, dealer_firm_name, dealer_name, dealer_mobile, city, agenda, jacpl_attended, cond_by, outcome, vertical, meeting_gift, meet_type, event_photo1,event_photo2,event_photo3,attended_count,MobileAttended,expense,Budget,Jacpl_Attended_count,ADE_Attended_count,Budget_brief,creation_dtm,is_active,pay_advance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        pool.query(insertQuery, [emp_code, formattedDateForDatabase, dealer_firmname, dealer_name, mobile_number, city, agenda, numberemp, numberade, outcome, vertical, Meeting, '3',Attachment1.length > 0 ? Attachment1[0].filename : '', Attachment2.length > 0 ? Attachment2[0].filename : '', Attachment3.length > 0 ? Attachment3[0].filename : '', count, number, expense, budget, countemp, countade, concatenatedValue, currentDateAndTime, is_active,additionalInfo], (error, results) => {
            if (error) {
                console.error(error);
                res.json({ error: 'Internal Server Error' });
            } else {
                let rc_query = `SELECT rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1;`
                pool.query(rc_query, (err, rc_results) => {
                    rc_id = rc_results[0].rc_id
                    if (email_send === 'Yes') {
                        try {
                            let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
                            pool.query(mailquery, [emp_code], async (error, results) => {
                                if (error) throw error;

                                // console.log(results)
                                let cc1 = results[0].RSM_ZSM_Email_ID
                                let receiver1 = results[0].REP_MANAGER_Email_ID
                                let emp_name = results[0].EMP_NAME

                                let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
                                // let RSM_ZSM_Name = results[0].RSM_ZSM_Name

                                let toAddresses = `${receiver1}`;
                                let ccAddresses = `${cc1}`;

                                let transporter = nodemailer.createTransport({
                                    host: 'jublcorp.mail.protection.outlook.com',
                                    port: 25,
                                    secure: false,
                                    auth: {
                                        user: 'g-smart.helpdesk@jubl.com',
                                        pass: 'jubl@123'
                                    },
                                    debug: true
                                });

                                let mailOptions = {
                                    from: 'g-smart.helpdesk@jubl.com',
                                    to: toAddresses,
                                    cc: ccAddresses,
                                    subject: 'Dealer Meet Approval',
                                    html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>

                                 
 
                                Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} contractors in Dealer Meet hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                 
                                BTL ID: ${rc_id}<br>
                                Allocated Budget: ${budget}<br>
                                Total Expence: ${expense}<br><br>

                                <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                        <a rel="noopener" target="_blank" href="${process.env.DEALER_MAIL_APPROVE}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                    </td>
                            
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td>&nbsp;</td>
                            
                                    <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                    <a rel="noopener" target="_blank" href="${process.env.DEALER_MAIL_REJECT}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                </td>
                                </tr>
                            </table>

                                <br><br>
                                 
                                Regards,
                                </p>`
                                };

                                try {
                                    let info = await transporter.sendMail(mailOptions);
                                    res.json({ message: `Email sent for approval with ID ${rc_id}`, number: number });
                                    // console.log('Email sent: ', info.messageId);
                                    return info;
                                } catch (error) {
                                    console.error('Error sending email: ', error);
                                    logger.error(error + ' in nodemailer')
                                    throw error;
                                }
                            })

                        } catch (emailError) {
                            console.error(emailError);
                            res.json({ error: 'Error sending email for approval' });
                        }
                    } else {
                        res.json({ message: `Dealer detail successfully submitted  with ID ${rc_id}`, number: number });
                    }
                })

            }

            let selectQuery = `SELECT MobileAttended, creation_dtm, rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1`;

            pool.query(selectQuery, function (error, results, fields) {
                if (error) {
                    console.error(error);
                    return;
                }

                for (let i = 0; i < results.length; i++) {
                    let rc_id = results[i].rc_id;
                    let creation_dtm = results[i].creation_dtm;
                    let mobile_numbers = results[i].MobileAttended;
                    const numbersArray = mobile_numbers.split(',');

                    numbersArray.forEach(function (value) {
                        const [dealerCode, secondPart] = value.split(':');
                        let dealerDataQuery = `SELECT * FROM dealer_master WHERE Customer_Code = ?`;
                        pool.query(dealerDataQuery, [dealerCode], function (fetchError, fetchResults) {
                            if (fetchError) {
                                console.error(fetchError);
                                return;
                            }

                            if (fetchResults.length > 0) {
                                let insertQuery = `INSERT INTO Jacpl_DealerMeetDetails (rc_id, Customer_Code, Customer_Name, Customer_Phone, Channel_Code, Customer_Type, City, Contact_Person, creation_dtm) VALUES (?,?,?,?,?,?,?,?,?)`;
                                pool.query(insertQuery, [rc_id, fetchResults[0].Customer_Code, fetchResults[0].Customer_Name, fetchResults[0].Customer_Phone, fetchResults[0].Channel_Code, fetchResults[0].Customer_Type, fetchResults[0].City, fetchResults[0].Contact_Person, creation_dtm], function (insertError, insertResults) {
                                    console.log(insertResults,'insertResults')
                                    if (insertError) {
                                        console.error(insertError);
                                    } else {
                                        
                                    }
                                });
                            } else {
                                let insertQuery = `INSERT INTO Jacpl_DealerMeetDetails (rc_id, Customer_Code, Customer_Name,  creation_dtm) VALUES (?,?,?,?)`;
                                pool.query(insertQuery, [rc_id, dealerCode, secondPart, creation_dtm], function (insertError, insertResults) {
                                    console.log(insertResults,'else')
                                    if (insertError) {
                                        console.error(insertError);
                                    } else {
                                       
                                    }
                                });
                            }
                        });
                    });

                }
            });


        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



route.post('/filter_detail_event', async (req, res) => {
    try {
        logger.info('Starting POST filter_detail_event ');

        let emp = req.session.employeeId;
        // console.log(emp, 'emp');
        const con = await dbConnection();
        const start_date = req.body.sd;
        const end_date = req.body.ed;
        const userInput = req.body.userInput;

        const moment = require('moment');
        let start_date_formatted = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let end_date_formatted = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

        let qry = `SELECT ROLE,EMP_DESI FROM JUBILANT_LOGIN WHERE EMP_CODE = '${emp}'`;
        con.query(qry, function (error, respon) {
            let ROLE = respon[0].ROLE;
            let EMP_DESI = respon[0].EMP_DESI;


            if (ROLE === "MANAGER" && EMP_DESI === "ZSM" || EMP_DESI === "RSM") {
                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.RSM_ZSM_ID = ? AND  DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type != 3`;

                let params = [emp, start_date_formatted, end_date_formatted];

                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }

                query += ` ORDER BY c.rc_id ASC`;

                con.query(query, params, function (error, results) {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let detailResults = [];

                    let count = 0;
                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_ContractorMeetDetails WHERE rc_id = ${rc_id}`;
                        con.query(detail_query, (err, detail_result) => {
                            console.log(detail_result, 'detail_result ZSM')
                            if (err) {
                                console.error(err);
                                res.status(500).json({ error: 'Internal Server Error' });
                                logger.error(`Error querying details: ${err}`);
                                return;
                            }
                            detailResults.push(detail_result);

                            count++;
                            if (count === results.length) {
                                res.json({ data: results, emp: emp, data1: detailResults });
                                logger.info(`Accessed POST filter_detail_event query ${emp}`);
                            }
                        });
                    }
                });

            } else if (ROLE === "MANAGER") {


                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.REP_MANAGER_ID = ? AND DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type != 3`;

                let params = [emp, start_date_formatted, end_date_formatted];

                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }

                query += ` ORDER BY c.rc_id ASC`;

                con.query(query, params, function (error, results) {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let detailResults = [];

                    let count = 0;
                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_ContractorMeetDetails WHERE rc_id = ${rc_id}`;
                        con.query(detail_query, (err, detail_result) => {
                            console.log(detail_result, 'detail_result manager')
                            if (err) {
                                console.error(err);
                                res.status(500).json({ error: 'Internal Server Error' });
                                logger.error(`Error querying details: ${err}`);
                                return;
                            }
                            detailResults.push(detail_result);

                            count++;
                            if (count === results.length) {
                                res.json({ data: results, emp: emp, data1: detailResults });
                                logger.info(`Accessed POST filter_detail_event query ${emp}`);
                            }
                        });
                    }
                });
            } else if (ROLE === "SUPER_ADMIN" || ROLE === "ADMIN") {

                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type != 3`;
                let params = [start_date_formatted, end_date_formatted];
                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }
                query += ` ORDER BY c.rc_id ASC`;
                con.query(query, params, function (error, results) {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let detailResults = [];

                    let count = 0;
                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_ContractorMeetDetails WHERE rc_id = ${rc_id}`;
                        con.query(detail_query, (err, detail_result) => {
                            console.log(detail_result, 'detail_result super_admin')
                            if (err) {
                                console.error(err);
                                res.status(500).json({ error: 'Internal Server Error' });
                                logger.error(`Error querying details: ${err}`);
                                return;
                            }
                            detailResults.push(detail_result);

                            count++;
                            if (count === results.length) {
                                res.json({ data: results, emp: emp, data1: detailResults });
                                logger.info(`Accessed POST filter_detail_event query ${emp}`);
                            }
                        });
                    }
                });

            } else if (ROLE === "EMPLOYEE") {

                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.EMP_CODE=? AND DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type != 3`;
                let params = [emp, start_date_formatted, end_date_formatted];

                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }

                query += ` ORDER BY c.rc_id ASC`;

                con.query(query, params, function (error, results) {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let detailResults = [];

                    let count = 0;
                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_ContractorMeetDetails WHERE rc_id = ${rc_id}`;
                        con.query(detail_query, (err, detail_result) => {
                            console.log(detail_result, 'detail_result')
                            if (err) {
                                console.error(err);
                                res.status(500).json({ error: 'Internal Server Error' });
                                logger.error(`Error querying details: ${err}`);
                                return;
                            }
                            detailResults.push(detail_result);

                            count++;
                            if (count === results.length) {
                                res.json({ data: results, emp: emp, data1: detailResults });
                                logger.info(`Accessed POST filter_detail_event query ${emp}`);
                            }
                        });
                    }
                });

            }



        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error(`Error POST filter_detail_event ${emp}`);
    }
});
route.post('/dealer_detail_event', async (req, res) => {
    try {
        logger.info('Starting POST filter_detail_event ');

        let emp = req.session.employeeId;
        const con = await dbConnection();
        const start_date = req.body.sd;
        const end_date = req.body.ed;
        const userInput = req.body.userInput;

        const moment = require('moment');
        let start_date_formatted = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let end_date_formatted = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

        let qry = `SELECT ROLE,EMP_DESI FROM JUBILANT_LOGIN WHERE EMP_CODE = '${emp}'`;
        con.query(qry, function (error, respon) {
            let ROLE = respon[0].ROLE;
            let EMP_DESI = respon[0].EMP_DESI;

            if (ROLE === "MANAGER" && EMP_DESI === "ZSM" || EMP_DESI === "RSM") {
                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.RSM_ZSM_ID=? AND DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type = 3`;

                let params = [emp, start_date_formatted, end_date_formatted];

                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }

                query += ` ORDER BY c.rc_id ASC`;

                con.query(query, params, function (error, results) {
                    if (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let promises = [];

                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_DealerMeetDetails WHERE rc_id = ?`;
                        promises.push(new Promise((resolve, reject) => {
                            con.query(detail_query, [rc_id], (err, detail_result) => {
                                if (err) {
                                    console.error(err);
                                    reject(err);
                                } else {
                                    resolve(detail_result);

                                }
                            });
                        }));
                    }

                    Promise.all(promises)
                        .then(detailResults => {
                            res.json({ data: results, emp: emp, data1: detailResults });
                            logger.info(`Accessed POST filter_detail_event query ${emp}`);
                        })
                        .catch(error => {
                            console.error(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error querying details: ${error}`);
                        });
                });

            } else if (ROLE === "MANAGER") {

                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.REP_MANAGER_ID = ? AND DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type = 3`;

                let params = [emp, start_date_formatted, end_date_formatted];

                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }

                query += ` ORDER BY c.rc_id ASC`;

                con.query(query, params, function (error, results) {
                    if (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let promises = [];

                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_DealerMeetDetails WHERE rc_id = ?`;
                        promises.push(new Promise((resolve, reject) => {
                            con.query(detail_query, [rc_id], (err, detail_result) => {
                                if (err) {
                                    console.error(err);
                                    reject(err);
                                } else {
                                    resolve(detail_result);
                                }
                            });
                        }));
                    }

                    Promise.all(promises)
                        .then(detailResults => {
                            res.json({ data: results, emp: emp, data1: detailResults });
                            logger.info(`Accessed POST filter_detail_event query ${emp}`);
                        })
                        .catch(error => {
                            console.error(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error querying details: ${error}`);
                        });
                });


            } else if (ROLE === "SUPER_ADMIN" || ROLE === "ADMIN") {

                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE  DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type = 3`;

                let params = [start_date_formatted, end_date_formatted];

                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }

                query += ` ORDER BY c.rc_id ASC`;

                con.query(query, params, function (error, results) {
                    if (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let promises = [];

                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_DealerMeetDetails WHERE rc_id = ?`;
                        promises.push(new Promise((resolve, reject) => {
                            con.query(detail_query, [rc_id], (err, detail_result) => {
                                console.log(detail_result, 'detail_result')
                                if (err) {
                                    console.error(err);
                                    reject(err);
                                } else {
                                    resolve(detail_result);
                                }
                            });
                        }));
                    }

                    Promise.all(promises)
                        .then(detailResults => {
                            res.json({ data: results, emp: emp, data1: detailResults });
                            logger.info(`Accessed POST filter_detail_event query ${emp}`);
                        })
                        .catch(error => {
                            console.error(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error querying details: ${error}`);
                        });
                });

            } else if (ROLE === "EMPLOYEE") {

                let query = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.EMP_CODE=? AND DATE(c.DateOfMeet) BETWEEN ? AND ? AND c.Meet_Type = 3`;

                let params = [emp, start_date_formatted, end_date_formatted];

                if (userInput.length > 0) {
                    query += ` AND c.rc_id = ?`;
                    params.push(userInput);
                }

                query += ` ORDER BY c.rc_id ASC`;

                con.query(query, params, function (error, results) {
                    if (error) {
                        console.error(error);
                        res.status(500).json({ error: 'Internal Server Error' });
                        logger.error(`Error POST filter_detail_event query ${emp} ${error}::query:: ${query}`);
                        return;
                    }

                    let promises = [];

                    for (let i = 0; i < results.length; i++) {
                        let rc_id = results[i].rc_id;

                        let detail_query = `SELECT * FROM Jacpl_DealerMeetDetails WHERE rc_id = ?`;
                        promises.push(new Promise((resolve, reject) => {
                            con.query(detail_query, [rc_id], (err, detail_result) => {
                                if (err) {
                                    console.error(err);
                                    reject(err);
                                } else {
                                    resolve(detail_result);
                                }
                            });
                        }));
                    }

                    Promise.all(promises)
                        .then(detailResults => {
                            res.json({ data: results, emp: emp, data1: detailResults });
                            logger.info(`Accessed POST filter_detail_event query ${emp}`);
                        })
                        .catch(error => {
                            console.error(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error querying details: ${error}`);
                        });
                });
            }


        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error(`Error POST filter_detail_event ${emp}`);
    }
});

route.post('/filter_event_report', async (req, res) => {
    try {
        let emp = req.session.employeeId;
        const con = await dbConnection();
        const start_date = req.body.sd;
        const end_date = req.body.ed;
        const event_category = req.body.evtc;
        const userInput = req.body.userInput;

        const moment = require('moment');
        let start_date_formatted = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let end_date_formatted = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

        let qry = `SELECT ROLE,EMP_DESI FROM JUBILANT_LOGIN WHERE EMP_CODE = '${emp}'`;
        con.query(qry, function (error, respon) {
            console.log(respon)
            let ROLE = respon[0].ROLE;
            let EMP_DESI = respon[0].EMP_DESI;

            if (event_category.length > 0 && userInput.length > 0) {
 
                if (ROLE === "MANAGER" && EMP_DESI === "ZSM" || EMP_DESI === "RSM") {
                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.RSM_ZSM_ID = ? AND (c.Meet_Type = ? AND c.rc_id = ?) AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [emp, event_category, userInput, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }
                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });


                } else if (ROLE === "MANAGER") {

                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.REP_MANAGER_ID = ? AND (c.Meet_Type = ? AND c.rc_id = ?) AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [emp, event_category, userInput, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }
                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                } else if (ROLE === "SUPER_ADMIN" || ROLE === "ADMIN" || ROLE === "COMMERCIAL") {

                    let loginQuery = `SELECT c.*,l.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE c.Meet_Type = ? AND c.rc_id = ? AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id ASC`;
                    con.query(loginQuery, [event_category, userInput, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                } else if (ROLE === "EMPLOYEE") {
                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE (c.Meet_Type = ? AND c.rc_id = ?)  AND l.EMP_CODE=? AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [event_category, userInput, emp, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                }

            } else if (event_category.length > 0 || userInput.length > 0) {

                if (ROLE === "MANAGER" && EMP_DESI === "ZSM" || EMP_DESI === "RSM") {

                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.RSM_ZSM_ID = ? AND (c.Meet_Type = ? OR c.rc_id = ?) AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [emp, event_category, userInput, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }
                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });


                } else if (ROLE === "MANAGER") {

                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.REP_MANAGER_ID = ? AND (c.Meet_Type = ? OR c.rc_id = ?) AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [emp, event_category, userInput, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });

                } else if (ROLE === "SUPER_ADMIN" || ROLE === "ADMIN" || ROLE === "COMMERCIAL") {

                    let loginQuery = `SELECT  c.*,l.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE c.Meet_Type = ? OR c.rc_id = ? AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [event_category, userInput, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                } else if (ROLE === "EMPLOYEE") {
                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE (c.Meet_Type = ? OR c.rc_id = ?) AND l.EMP_CODE=? AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [event_category, userInput, emp, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                }

            } else {
                if (ROLE === "MANAGER" && EMP_DESI === "ZSM" || EMP_DESI === "RSM") {

                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON EMP_CODE = c.emp_id WHERE l.RSM_ZSM_ID = ? AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [emp, start_date_formatted, end_date_formatted], function (error, results) {
                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });

                } else if (ROLE === "MANAGER") {
                    console.log('12')
                    let loginQuery = `SELECT  c.*,l.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.REP_MANAGER_ID = ? AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    con.query(loginQuery, [emp, start_date_formatted, end_date_formatted], function (error, results) {
                        console.log(results, 'results')
                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                } else if (ROLE === "SUPER_ADMIN" || ROLE === "ADMIN" || ROLE === "COMMERCIAL") {

                    let loginQuery = `SELECT c.*, l.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id ASC`;
                    con.query(loginQuery, [start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                } else if (ROLE === "EMPLOYEE") {
                    let loginQuery = `SELECT l.*, c.* FROM JUBILANT_LOGIN l INNER JOIN Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id WHERE l.EMP_CODE=? AND DATE(c.DateOfMeet) BETWEEN ? AND ? ORDER BY c.rc_id DESC`;
                    console.log(loginQuery, 'loginQuery')
                    con.query(loginQuery, [emp, start_date_formatted, end_date_formatted], function (error, results) {

                        if (error) {
                            console.log(error);
                            res.status(500).json({ error: 'Internal Server Error' });
                            logger.error(`Error POST filter_event loginQuery ${emp} ${error}::query:: ${loginQuery}`);
                            return;
                        }

                        res.json({ data: results, emp: emp });
                        logger.info(`Accessed POST filter_event loginQuery ${emp}`);
                    });
                }

            }
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error('Error POST filter_event');
    }
});

route.post('/filter_view_rejected_approved_btl', async (req, res) => {
    try {
        logger.info('Starting POST filter_view_rejected_approved_btl');

        let emp = req.session.employeeId;
        let sd = req.body.sd;
        let ed = req.body.ed;
        let ddown = req.body.ddown;
       

        const con = await dbConnection();
        const moment = require('moment');
        let start_date_formatted = moment(sd, 'DD-MM-YYYY').format('YYYY-MM-DD');
        let end_date_formatted = moment(ed, 'DD-MM-YYYY').format('YYYY-MM-DD');

        let query = `
            SELECT 
                l.*, 
                c.*
            FROM 
                JUBILANT_LOGIN l
            INNER JOIN 
                Jacpl_ContractorMeet c ON l.EMP_CODE = c.emp_id
            WHERE 
                DATE(c.DateOfMeet) BETWEEN ? AND ?`;

        let params = [start_date_formatted,end_date_formatted];

        if (ddown == 2) {
            query += ` AND c.is_active = 2`;
        } else if (ddown == 3) {
            query += ` AND c.is_active = 3`;
        }else if (ddown === 'Pending_Voucher' || ddown === 2) {
            query += ` AND c.is_active = 2`;
        } else {
            query += ` AND c.is_active = 0`;
        }

        con.query(query, params, function (error, results) {
            if (error) {
                console.log(error);
                res.status(500).json({ error: 'Internal Server Error' });
                logger.error(`Error POST filter_view_rejected_approved_btl query ${emp} ${error}::query:: ${query}`);
                return;
            }

            // console.log(results);
            res.json({ data: results, emp: emp });
            logger.info(`Accessed POST filter_view_rejected_approved_btl query ${emp}`);
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error(`Error POST filter_view_rejected_approved_btl ${emp} ${error}`);
    }
});


// route.post('/sga_meet', upload.fields([
//     { name: 'Attachment1', maxCount: 1 },
//     { name: 'Attachment2', maxCount: 1 },
//     { name: 'Attachment3', maxCount: 1 },
// ]), async function (req, res) {
//     try {
//         const currentDateAndTime = getCurrentDateAndTime();

//         console.log("1 in sga meet")
//         logger.info("1 in sga meet")
//         let email_send = req.body.email_to_send;

//         let { Attachment1 = [], Attachment2 = [], Attachment3 = [] } = req.files;

//         let emp_code = req.body.employeeId;
//         let dealer_code = 'null'
//         let dealer_firmname = 'null'
//         let dealer_name = 'null'
//         let mobile_number = 'null'
//         let city = 'null'
//         console.log("2 in sga meet")
//         logger.info("2 in sga meet")
//         let agendaLines = req.body.Agenda.split('\n');
//         let agenda = agendaLines.join(' ');
//         let outcomeLines = req.body.Outcome.split('\n');
//         let outcome = outcomeLines.join(' ');
//         let dateformate = req.body.dateformate;
//         formattedDateForDatabase = moment(dateformate, 'DD-MM-YYYY').format('YYYY-MM-DD');
//         let vertical = req.body.vertical;
//         let Meeting = req.body.Meeting;
//         let count = req.body.count;
//         let countemp = req.body.countemp;
//         let countade = req.body.countade;
//         let number = req.body.number;
//         let numberemp = req.body.numberemp;
//         let numberade = req.body.numberade;
//         let expense = req.body.expense;
//         let budget = req.body.budget;
//         let { cal, cal1, cal2 } = req.body;
//         const additionalInfo = req.body.additionalInfo;

//         console.log("3 in sga meet")
//         logger.info("3 in sga meet")
//         let concatenatedValue = `${cal2} + ${cal1} + ${cal}`;

//         const pool = await dbConnection();

//         let is_active = (email_send === 'Yes') ? '0' : '1';

//         console.log("4 in sga meet")
//         logger.info("4 in sga meet")

//         let insertQuery = `
//             INSERT INTO Jacpl_ContractorMeet (emp_id, dateofmeet, dealer_code, dealer_firm_name, dealer_name, dealer_mobile, city, agenda, jacpl_attended, cond_by, outcome, vertical, meeting_gift, meet_type, event_photo1,event_photo2,event_photo3,attended_count,MobileAttended,expense,Budget,Jacpl_Attended_count,ADE_Attended_count,Budget_brief,creation_dtm,is_active,pay_advance)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//         `;

//         pool.query(insertQuery, [emp_code, formattedDateForDatabase, dealer_code, dealer_firmname, dealer_name, mobile_number, city, agenda, numberemp, numberade, outcome, vertical, Meeting, '4', Attachment1.length > 0 ? Attachment1[0].filename : '', Attachment2.length > 0 ? Attachment2[0].filename : '', Attachment3.length > 0 ? Attachment3[0].filename : '', count, number, expense, budget, countemp, countade, concatenatedValue, currentDateAndTime, is_active,additionalInfo], async (error, results) => {
//             // console.log(results, 'results')
//             if (error) {
//                 console.log(error);
//                 logger.error(error)
//                 res.json({ error: 'Internal Server Error' });
//             } else {

//                 console.log("5 in sga meet")
//                 logger.info("5 in sga meet")

//                 let rc_query = `SELECT rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1;`
//                 pool.query(rc_query, (err, rc_results) => {
//                     rc_id = rc_results[0].rc_id
//                     if (email_send === 'Yes') {
//                         try {
//                             let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
//                             pool.query(mailquery, [emp_code], async (error, results) => {
//                                 if (error) throw error;
//                                 console.log(error)
//                                 logger.error(error)

                            
//                                 let cc1 = results[0].RSM_ZSM_Email_ID
//                                 let receiver1 = results[0].REP_MANAGER_Email_ID
//                                 let emp_name = results[0].EMP_NAME

//                                 let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
                              

//                                 let toAddresses = `${receiver1}`;
//                                 let ccAddresses = `${cc1}`;

//                                 let transporter = nodemailer.createTransport({
//                                     host: 'jublcorp.mail.protection.outlook.com',
//                                     port: 25,
//                                     secure: false,
//                                     auth: {
//                                         user: 'g-smart.helpdesk@jubl.com',
//                                         pass: 'jubl@123'
//                                     },
//                                     debug: true
//                                 });

//                                 let mailOptions = {
//                                     from: 'g-smart.helpdesk@jubl.com',
//                                     to: toAddresses,
//                                     cc: ccAddresses,
//                                     subject: 'SGA Meet Approval',
//                                     html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>

                                 
 
//                                 Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} contractors in SGA Meet hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                 
//                                 BTL ID: ${rc_id}<br>
//                                 Allocated Budget: ${budget}<br>
//                                 Total Expence: ${expense}<br><br>

//                                 <table border="0" cellspacing="0" cellpadding="0">
//                                 <tr>
//                                     <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
//                                         <a rel="noopener" target="_blank" href="${process.env.SGA_MAIL_APPROVE}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
//                                     </td>
                            
//                                     <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
//                                     <td>&nbsp;</td>
                            
//                                     <td align="center" style="border-radius: 5px; background-color: #cc0001;">
//                                     <a rel="noopener" target="_blank" href="${process.env.SGA_MAIL_REJECT}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
//                                 </td>
//                                 </tr>
//                             </table>

//                                 <br><br>
                                 
//                                 Regards,
//                                 </p>`
//                                 };

//                                 try {
//                                     let info = await transporter.sendMail(mailOptions);
//                                     res.json({ message: `Email sent for approval with ID ${rc_id}`, number: number });
//                                     // console.log('Email sent: ', info.messageId);
//                                     console.log("6 in sga meet")
//                                     logger.info("6 in sga meet")
//                                     return info;
//                                 } catch (error) {
//                                     console.log('Error sending email: ', error);
//                                     logger.error(error + ' in nodemailer')
//                                     throw error;
//                                 }
//                             })

//                         } catch (emailError) {
//                             console.log(emailError);
//                             logger.error(emailError)
//                             res.json({ error: 'Error sending email for approval' });
//                         }
//                     } else {
//                         res.json({ message: `SGA detail successfully submitted  with ID ${rc_id}`, number: number });
//                         console.log("7 in sga meet")
//                         logger.info("7 in sga meet")
//                     }
//                 })

//             }

//             console.log("8 in sga meet")
//             logger.info("8 in sga meet")

//             let selectQuery = `SELECT MobileAttended, creation_dtm, rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1`;


//             pool.query(selectQuery, function (error, results, fields) {
//                 if (error) {
//                     console.log(error);
//                     logger.error(error)
//                     return;
//                 }

//                 for (let i = 0; i < results.length; i++) {
//                     let rc_id = results[i].rc_id;
//                     let mobile_numbers = results[i].MobileAttended;
//                     let creation_dtm = results[i].creation_dtm

//                     const numbersArray = mobile_numbers.split(',').map(Number);

//                     numbersArray.forEach(function (userData) {
//                         let insertQuery = `INSERT INTO Jacpl_ContractorMeetDetails (rc_id, Inf_Mobile,creation_dtm) VALUES (?,?,?)`;
//                         pool.query(insertQuery, [rc_id, userData, creation_dtm], function (insertError, insertResults) {
//                             if (insertError) {
//                                 console.log(insertError);
//                                 logger.error(insertError)
//                             } else {
//                                 // console.log("Insert successful for rc_id:", rc_id);
//                                 console.log("9 in sga meet")
//                                 logger.info("9 in sga meet")
//                             }
//                         });
//                     })
//                 }
//             });
//         });
//     } catch (err) {
//         console.log(err);
//         logger.error(err)
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


route.post('/sga_meet', upload.fields([
    { name: 'Attachment1', maxCount: 1 },
    { name: 'Attachment2', maxCount: 1 },
    { name: 'Attachment3', maxCount: 1 },
]), async function (req, res) {
    try {
        const currentDateAndTime = getCurrentDateAndTime();

        console.log("1 in sga meet")
        logger.info("1 in sga meet")
        let email_send = req.body.email_to_send;

              let { Attachment1 = [], Attachment2 = [], Attachment3 = [] } = req.files;

        let emp_code = req.body.employeeId;
        let emp_name = req.session.emp_Name;
        let dealer_code = 'null'
        let dealer_firmname = 'null'
        let dealer_name = 'null'
        let mobile_number = 'null'
        let city = 'null'
        console.log("2 in sga meet")
        logger.info("2 in sga meet")
        let agendaLines = req.body.Agenda.split('\n');
        let agenda = agendaLines.join(' ');
        let outcomeLines = req.body.Outcome.split('\n');
        let outcome = outcomeLines.join(' ');
        let dateformate = req.body.dateformate;
        formattedDateForDatabase = moment(dateformate,'DD-MM-YYYY').format('YYYY-MM-DD');
        let vertical = req.body.vertical;
        let Meeting = req.body.Meeting;
        let count = req.body.count;
        let countemp = req.body.countemp;
        let countade = req.body.countade;
        let number = req.body.number;
        let numberemp = req.body.numberemp;
        let numberade = req.body.numberade;
        let expense = req.body.expense;
        let budget = req.body.budget;
        const additionalInfo = req.body.additionalInfo;
       
        console.log(additionalInfo,'additionalInfo')
  


        
        let { cal, cal1, cal2 } = req.body;

        console.log("3 in sga meet")
        logger.info("3 in sga meet")
        let concatenatedValue = `${cal2} + ${cal1} + ${cal}`;

        const pool = await dbConnection();

        let is_active;
        let status_ma;

        if (email_send === 'Yes' && expense < budget) {
            is_active = '0';
            status_ma = 5;
        } else if (email_send === 'No' && expense < budget) {
            is_active = '1';
            status_ma = 5;
        } else if (email_send === 'Yes' && expense > budget) {
            is_active = '0';
            status_ma = 6;
        } else if (email_send === 'No' && expense > budget) {
            is_active = '0';
            status_ma = 6;
        }

        console.log("4 in sga meet")
        logger.info("4 in sga meet")

        let insertQuery = `
            INSERT INTO Jacpl_ContractorMeet (emp_id, dateofmeet, dealer_code, dealer_firm_name, dealer_name, dealer_mobile, city, agenda, jacpl_attended, cond_by, outcome, vertical, meeting_gift, meet_type, event_photo1,event_photo2,event_photo3,attended_count,MobileAttended,expense,Budget,Jacpl_Attended_count,ADE_Attended_count,Budget_brief,creation_dtm,is_active,Manager_Approval_status,pay_advance)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

        pool.query(insertQuery, [emp_code, formattedDateForDatabase, dealer_code, dealer_firmname, dealer_name, mobile_number, city, agenda, numberemp, numberade, outcome, vertical, Meeting, '4',Attachment1.length > 0 ? Attachment1[0].filename : '', Attachment2.length > 0 ? Attachment2[0].filename : '', Attachment3.length > 0 ? Attachment3[0].filename : '', count, number, expense, budget, countemp, countade, concatenatedValue, currentDateAndTime, is_active,status_ma,additionalInfo], async (error, results) => {
            // console.log(results, 'results')
            if (error) {
                console.log(error);
                logger.error(error)
                res.json({ error: 'Internal Server Error' });
            } else {

                console.log("5 in sga meet")
                logger.info("5 in sga meet")

                let rc_query = `SELECT rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1;`
                pool.query(rc_query, (err, rc_results) => {
                    if(err) throw err
                    rc_id = rc_results[0].rc_id


                    if (email_send === 'Yes' && expense > budget) {

                        console.log('dono')
                        const transporter = nodemailer.createTransport({
                            service: 'gmail', 
                            auth: {
                                 user: 'vishal.manthanitsolutions@gmail.com',
                                  pass: 'yjal dkyp ncld juil'
                            }
                        });
                        
                        const mailOption1 = {
                            from: 'vishal.manthanitsolutions@gmail.com',
                            to: 'yogeshmanthanitsolution@gmail.com',
                            cc: 'ramkeshn311@gmail.com',
                            subject: 'SGA Meet Budget Exceeds',
                                html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>
                                        Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} Contractors/Dealers in SGA Meet and Expense amount greater than the allocated budget hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                                     
                                        BTL ID: ${rc_id}<br>
                    
                                        JACPL Employee Count: ${countemp}<br>
                    
                                        ADE Employee Count: ${countade}<br>
                    
                                        Budget Brife: ${concatenatedValue}<br>
                    
                                        BTL Advance Amount: ${additionalInfo}<br>
                    
                                        Allocated Budget: ${budget}<br>
                    
                                        Total Expense: ${expense}<br>
                    
                                      <br>
                    
                                        Note: BTL & Expense approve & Reject by ZSM/RSM only.<br>
                    
                                        <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                                <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_APPROVE}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                            </td>
                                    
                                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                            <td>&nbsp;</td>
                                    
                                            <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                            <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_REJECT}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                        </td>
                                        </tr>
                                    </table>
                    
                                <br><br>
                                    
                                Regards,
                                </p>`
                             };
                    
                                                  
                     
                    
                        transporter.sendMail(mailOption1, (error, info) => {
                            if (error) {
                                return res.status(500).send(error.toString());
                            }
                            res.status(200).send('Email sent: ' + info.response);
                        });

                     
                    }else {
                        res.json({ message: `SGA detail successfully submitted  with ID ${rc_id}`, number: number });
                        console.log("7 in sga meet")
                        logger.info("7 in sga meet")
                        
                    } if (email_send === 'Yes') {
                        try {
                            let mailquery = `SELECT * FROM JUBILANT_LOGIN WHERE EMP_CODE=?`
                            pool.query(mailquery, [emp_code], async (error, results) => {
                                if (error) throw error;
                                console.log(error)
                                logger.error(error)

                            
                                let cc1 = results[0].RSM_ZSM_Email_ID
                                let receiver1 = results[0].REP_MANAGER_Email_ID
                                let emp_name = results[0].EMP_NAME

                                let REP_MANAGER_NAME = results[0].REP_MANAGER_NAME
                              

                                let toAddresses = `${receiver1}`;
                                let ccAddresses = `${cc1}`;

                                // let transporter = nodemailer.createTransport({
                                //     host: 'jublcorp.mail.protection.outlook.com',
                                //     port: 25,
                                //     secure: false,
                                //     auth: {
                                //         user: 'g-smart.helpdesk@jubl.com',
                                //         pass: 'jubl@123'
                                //     },
                                //     debug: true
                                // });

                                
                        const transporter = nodemailer.createTransport({
                            service: 'gmail', 
                            auth: {
                                 user: 'vishal.manthanitsolutions@gmail.com',
                                  pass: 'yjal dkyp ncld juil'
                            }
                        });
                                let mailOptions = {
                                    from: 'vishal.manthanitsolutions@gmail.com',
                                    to: toAddresses,
                                    cc: ccAddresses,
                                    subject: 'SGA Meet Approval',
                                    html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>

                                 
 
                                Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} contractors in SGA Meet hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                 
                                BTL ID: ${rc_id}<br>
                    
                                JACPL Employee Count: ${countemp}<br>
                    
                             ADE Employee Count: ${countade}<br>
                    
                                                    Budget Brife: ${concatenatedValue}<br>
                    
                                                    BTL Advance Amount: ${additionalInfo}<br>
                    
                                                    Allocated Budget: ${budget}<br>
                    
                                                    Total Expense: ${expense}<br>


                                                     <br>
                    
                                        Note: BTL & Expense approve & Reject by BM/ASM/TM/BDM/TSS only.<br>

                                <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                        <a rel="noopener" target="_blank" href="${process.env.SGA_MAIL_APPROVE}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                    </td>
                            
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td>&nbsp;</td>
                            
                                    <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                    <a rel="noopener" target="_blank" href="${process.env.SGA_MAIL_REJECT}/${rc_id}/${REP_MANAGER_NAME}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                </td>
                                </tr>
                            </table>

                                <br><br>
                                 
                                Regards,
                                </p>`
                                };

                                try {
                                    let info = await transporter.sendMail(mailOptions);
                                    res.json({ message: `Email sent for approval with ID ${rc_id}`, number: number });
                                  
                                    console.log("6 in sga meet")
                                    logger.info("6 in sga meet")
                                    return info;
                                } catch (error) {
                                    console.log('Error sending email: ', error);
                                    logger.error(error + ' in nodemailer')
                                    throw error;
                                }

                               
                            })
                           

                        } catch (emailError) {
                            console.log(emailError);
                            logger.error(emailError)
                            res.json({ error: 'Error sending email for approval' });
                        }
                    } else {
                        res.json({ message: `SGA detail successfully submitted  with ID ${rc_id}`, number: number });
                        console.log("7 in sga meet")
                        logger.info("7 in sga meet")
                    }
                  
                    if (expense > budget) {

                       
                        const transporter = nodemailer.createTransport({
                            service: 'gmail', 
                            auth: {
                                 user: 'vishal.manthanitsolutions@gmail.com',
                                  pass: 'yjal dkyp ncld juil'
                            }
                        });
                        
                        const mailOption1 = {
                            from: 'vishal.manthanitsolutions@gmail.com',
                            to: 'yogeshmanthanitsolution@gmail.com',
                            cc: 'ramkeshn311@gmail.com',
                            subject: 'SGA Meet Budget Exceeds',
                                html: `<p style="font-size: 13px;font-weight: 600;color: black;">Dear Team,<br><br>
                                        Employee ID: ${emp_code} Name: ${emp_name} has punched ${count} Contractors/Dealers in SGA Meet and Expense amount greater than the allocated budget hence this approval mail is coming to highlight the cases, please verify and approve or reject the case for further action from commercial team.<br><br>
                                                     
                                        BTL ID: ${rc_id}<br>
                    
                                        JACPL Employee Count: ${countemp}<br>
                    
                                        ADE Employee Count: ${countade}<br>
                    
                                        Budget Brife: ${concatenatedValue}<br>
                    
                                        BTL Advance Amount: ${additionalInfo}<br>
                    
                                        Allocated Budget: ${budget}<br>
                    
                                        Total Expense: ${expense}<br>
                    
                                      <br>
                    
                                        Note: BTL & Expense approve & Reject by ZSM/RSM only.<br>
                    
                                        <table border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" style="border-radius: 5px; background-color: #1F7F4C;">
                                                <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_APPROVE}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid white; display: inline-block;">Approve</a>
                                            </td>
                                    
                                            <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                            <td>&nbsp;</td>
                                    
                                            <td align="center" style="border-radius: 5px; background-color: #cc0001;">
                                            <a rel="noopener" target="_blank" href="${process.env.INSHOP_MAIL_REJECT}/${rc_id}" target="_blank" style="font-size: 13px; font-family: Helvetica, Arial, sans-serif; color:#ffffff ; font-weight: 600; text-decoration: none;border-radius: 5px; padding: 8px 15px; border: 1px solid #cc0001; display: inline-block;">&nbsp;Reject&nbsp;</a>
                                        </td>
                                        </tr>
                                    </table>
                    
                                <br><br>
                                    
                                Regards,
                                </p>`
                             };
                    
                                                  
                     
                    
                        transporter.sendMail(mailOption1, (error, info) => {
                            if (error) {
                                return res.status(500).send(error.toString());
                            }
                            res.status(200).send('Email sent: ' + info.response);
                        });

                     
                    }

                    
               
                })

                

            }

            console.log("8 in sga meet")
            logger.info("8 in sga meet")

            let selectQuery = `SELECT MobileAttended, creation_dtm, rc_id FROM Jacpl_ContractorMeet ORDER BY rc_id DESC LIMIT 1`;


            pool.query(selectQuery, function (error, results, fields) {
                console.log(results,'results')
                if (error) {
                    console.log(error);
                    logger.error(error)
                    return;
                }

                for (let i = 0; i < results.length; i++) {
                    let rc_id = results[i].rc_id;
                    let creation_dtm = results[i].creation_dtm
                    let mobile_numbers = results[i].MobileAttended;
                    let values = mobile_numbers.split(',');

                  
                    let numbersArray = values.map(item => {
                        let pair = item.split(':');
                        return { mobile: pair[0].trim(), gift: pair[1].trim() }; 
                    });

                 

                    
                    numbersArray.forEach(function (userData) {
                        let insertQuery = `INSERT INTO Jacpl_ContractorMeetDetails (rc_id, Inf_Mobile, creation_dtm, gift_name) VALUES (?,?,?,?)`;
                        pool.query(insertQuery, [rc_id, userData.mobile, creation_dtm, userData.gift], function (insertError, insertResults) {
                           
                            if (insertError) {
                                console.log(insertError);
                                logger.error(insertError);
                            } else {
                                console.log("Insert successful for rc_id:", rc_id);
                                logger.info("Insert successful for rc_id:", rc_id);
                            }
                        });
                    });
            
                    
                }
            });
        });
    } catch (err) {
        console.log(err);
        logger.error(err)
        res.status(500).json({ error: 'Internal Server Error' });
    }
});






route.get('/add_new_iclub', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('add_new_iclub')
        logger.info('Accessed GET in add_new_iclub ' + emp)

    } catch (error) {
        logger.error('Error GET in add_new_iclub ' + emp + error)

    }
})



route.get('/iclub_details', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('iclub_details')
        logger.info('Accessed GET in iclub_details ' + emp)

    } catch (error) {
        logger.error('Error GET in iclub_details ' + emp + error)

    }
})




route.get('/view_edit_iclub_report', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('view_edit_iclub_report')
        logger.info('Accessed GET in view_edit_iclub_report ' + emp)

    } catch (error) {
        logger.error('Error GET in view_edit_iclub_report ' + emp + error)

    }
})




route.get('/view_dealer_report_monthwise', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('view_dealer_report_monthwise')
        logger.info('Accessed GET in view_dealer_report_monthwise ' + emp)

    } catch (error) {
        logger.error('Error GET in view_dealer_report_monthwise ' + emp + error)

    }
})


route.get('/download_ageing_report', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('download_ageing_report')
        logger.info('Accessed GET in download_ageing_report ' + emp)

    } catch (error) {
        logger.error('Error GET in download_ageing_report ' + emp + error)

    }
})

route.post('/download_ageing_report', async (req, res) => {
    try {

        let emp = req.session.employeeId
        logger.info('Starting POST download_ageing_report ' + emp)
        const date = new Date();

        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();

        const currentDate = moment(`${day}-${month}-${year}`, 'DD-MM-YYYY').format('YYYY-MM-DD');



        const d_code = req.body.data

        const con = await dbConnection();

        const dbdate = `SELECT start_date FROM Jacpl_master WHERE ID=?`;
        con.query(dbdate, [2], function (err, results1) {
            if (err) throw err;
            logger.error('Error in post download_ageing_report dbdate ' + emp + err + dbdate)
            const sd = results1[0].start_date
            const sd_date = moment(sd).format('YYYY-MM-DD')




            const fmsd_date = moment(sd).format('DD-MM-YYYY')
            const fcr_date = moment(currentDate).format('DD-MM-YYYY')
            let roleQuery = `SELECT * FROM Ageing_Report WHERE Customer_ID= ? AND Ageing_date BETWEEN ? AND ?`;
            con.query(roleQuery, [d_code, sd_date, currentDate], function (error, results, fields) {
                if (error) {
                    console.log(error)
                    logger.error('Error in post download_ageing_report roleQuery ' + emp + error + roleQuery)

                } else {
                    // console.log(results)

                    res.json({ data: results, start_date: fmsd_date, });
                    logger.info('Accessed Post in download_ageing_report' + emp)







                }

            })





        });



    } catch (err) {
        console.log(err)
        logger.error('Error POST in download_account_st ' + emp + error)

    }


})

route.get('/upload_ageing_report', authenticate, function (req, res) {
    try {
        let emp = req.session.employeeId
        res.render('upload_ageing_report')
        logger.info('Accessed GET in upload_ageing_report ' + emp)

    } catch (error) {
        logger.error('Error GET in upload_ageing_report ' + emp + error)

    }
})


route.post('/upload_ageing_report', async (req, res) => {
    try {
        const con = await dbConnection();
        const dataFromBody = JSON.parse(req.body.data);
        const currentDateAndTime = getCurrentDateAndTime();

        for (let i = 0; i < dataFromBody.length; i++) {
            let Company = dataFromBody[i].Company;
            let Company_Name = dataFromBody[i].Company_Name;
            let Customer_ID = dataFromBody[i].Customer_ID;
            let Customer_Name = dataFromBody[i].Customer_Name;
            let Outstanding_Amount = parseFloat(dataFromBody[i].Outstanding_Amount);
            let Amount_Not_Due = parseFloat(dataFromBody[i].Amount_Not_Due);
            let _0_To_30 = parseFloat(dataFromBody[i]['0_To_30']);
            let _31_To_60 = parseFloat(dataFromBody[i]['31_To_60']);
            let _61_To_90 = parseFloat(dataFromBody[i]['61_To_90']);
            let _91_To_120 = parseFloat(dataFromBody[i]['91_To_120']);
            let _121_To_180 = parseFloat(dataFromBody[i]['121_To_180']);
            let _181_To_365 = parseFloat(dataFromBody[i]['181_To_365']);
            let Greaterthan_365_Days = parseFloat(dataFromBody[i]['Greaterthan_365_Days']);
            let Unadjusted_Credit_Bal = parseFloat(dataFromBody[i].Unadjusted_Credit_Bal);
            let Ageing_date = moment(dataFromBody[i].Ageing_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

            let selectQuery = `SELECT COUNT(*) AS count FROM Ageing_Report WHERE Company = ? AND Ageing_date = ? AND Customer_ID = ?`;
            con.query(selectQuery, [Company, Ageing_date, Customer_ID], (selectErr, selectResults) => {
                if (selectErr) {
                    console.log(selectErr);
                    logger.error('in upload ageing report selectQuery ::', selectErr);
                } else {
                    if (selectResults[0].count === 0) {
                        let insertQuery = `INSERT INTO Ageing_Report(Company, Company_Name, Customer_ID, Customer_Name, Outstanding_Amount, Amount_Not_Due,0_To_30,31_To_60,61_To_90,91_To_120,121_To_180,181_To_365, Greaterthan_365_Days, Unadjusted_Credit_Bal, Ageing_date, CREATION_DATETIME) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
                        con.query(insertQuery, [Company, Company_Name, Customer_ID, Customer_Name, Outstanding_Amount, Amount_Not_Due, _0_To_30, _31_To_60, _61_To_90, _91_To_120, _121_To_180, _181_To_365, Greaterthan_365_Days, Unadjusted_Credit_Bal, Ageing_date, currentDateAndTime], (insertErr, insertResults) => {
                            if (insertErr) {
                                console.log(insertErr);
                                logger.error('in upload ageing report insertQuery ::', insertErr);
                            } else {
                                // console.log(insertResults);
                            }
                        });
                    } else {
                        let updateQuery = `UPDATE Ageing_Report SET Company_Name=?, Customer_Name=?, Outstanding_Amount=?, Amount_Not_Due=?, 0_To_30=?,31_To_60=?,61_To_90=?,91_To_120=?,121_To_180=?,181_To_365=?,Greaterthan_365_Days=?,Unadjusted_Credit_Bal=?, CREATION_DATETIME=? WHERE Company=? AND Ageing_date=? AND Customer_ID=?`;
                        con.query(updateQuery, [Company_Name, Customer_Name, Outstanding_Amount, Amount_Not_Due, _0_To_30, _31_To_60, _61_To_90, _91_To_120, _121_To_180, _181_To_365, Greaterthan_365_Days, Unadjusted_Credit_Bal, currentDateAndTime, Company, Ageing_date, Customer_ID], (updateErr, updateResults) => {
                            if (updateErr) {
                                console.log(updateErr);
                                logger.error('in upload ageing report updateQuery ::', updateErr);
                            } else {
                                // console.log('updating same  Data ');
                            }
                        });
                    }
                }
            });
        }

        res.status(200).json({ message: 'Data inserted or updated successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error('in upload ageing report :: ', err);
    }
});






// route.get('/sga_mail_approve/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
//     try {
//         const date = new Date();
//         const day = date.getDate();
//         const month = date.getMonth() + 1;
//         const year = date.getFullYear();
//         const currentDate = `${year}-${month}-${day}`;

//         const rc_id = req.params.rc_id;
//         const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

//         const pool = await dbConnection();

//         const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
//         pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
//             console.log(selectResults,'selectResults')
//             if (selectError) {
//                 console.error(selectError);
//                 res.status(500).json({ error: 'Internal Server Error' });
//             } else if (selectResults.length > 0) {
//                 const isActive = selectResults[0].is_active;
//                 if (isActive === 0) {
//                     const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 1, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
//                     pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
//                         console.log(updateResults,'updateResults')
//                         if (updateError) {
//                             console.error(updateError);
//                             res.status(500).json({ error: 'Error updating record status' });
//                         } else {
//                             res.json({ message: `SGA Meet with ID ${rc_id} approved successfully` });
//                         }
//                     });
//                 } else if (isActive === 1) {
//                     res.json({ message: `SGA Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
//                 } else if (isActive === 4) {
//                     res.json({ message: `SGA Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
//                 }
//             } else {
//                 res.json({ message: `No record found for SGA Meet with ID ${rc_id}` });
//             }
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


route.get('/sga_mail_approve/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 1, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `SGA Meet with ID ${rc_id} approved successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `SGA Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `SGA Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for SGA Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




route.get('/sga_mail_reject/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 4, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `SGA Meet with ID ${rc_id} rejected successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `SGA Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `SGA Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for SGA Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



route.get('/inshop_mail_approve/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 1, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `Inshop Meet with ID ${rc_id} approved successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `Inshop Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `Inshop Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for Inshop Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


route.get('/inshop_mail_reject/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 4, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `Inshop Meet with ID ${rc_id} rejected successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `Inshop Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `Inshop Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for Inshop Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


route.get('/contractor_mail_approve/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 1, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `Contractor Meet with ID ${rc_id} approved successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `Contractor Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `Contractor Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for Contractor Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




route.get('/contractor_mail_reject/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 4, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `Contractor Meet with ID ${rc_id} rejected successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `Contractor Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `Contractor Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for Contractor Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




route.get('/dealer_mail_approve/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 1, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `Dealer Meet with ID ${rc_id} approved successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `Dealer Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `Dealer Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for Dealer Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




route.get('/dealer_mail_reject/:rc_id/:REP_MANAGER_NAME', async function (req, res) {
    try {
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const currentDate = `${year}-${month}-${day}`;

        const rc_id = req.params.rc_id;
        const REP_MANAGER_NAME = req.params.REP_MANAGER_NAME;

        const pool = await dbConnection();

        const selectQuery = `SELECT * FROM Jacpl_ContractorMeet WHERE rc_id = ?`;
        pool.query(selectQuery, [rc_id], (selectError, selectResults) => {
            if (selectError) {
                console.error(selectError);
                res.status(500).json({ error: 'Internal Server Error' });
            } else if (selectResults.length > 0) {
                const isActive = selectResults[0].is_active;
                if (isActive === 0) {
                    const updateQuery = `UPDATE Jacpl_ContractorMeet SET is_active = 4, Approved_by = ?, Manager_Approval_date = ? WHERE rc_id = ?`;
                    pool.query(updateQuery, [REP_MANAGER_NAME, currentDate, rc_id], (updateError, updateResults) => {
                        if (updateError) {
                            console.error(updateError);
                            res.status(500).json({ error: 'Error updating record status' });
                        } else {
                            res.json({ message: `Dealer Meet with ID ${rc_id} rejected successfully` });
                        }
                    });
                } else if (isActive === 1) {
                    res.json({ message: `Dealer Meet with ID ${rc_id} has already been approved by ${REP_MANAGER_NAME}` });
                } else if (isActive === 4) {
                    res.json({ message: `Dealer Meet with ID ${rc_id} has already been rejected by ${REP_MANAGER_NAME}` });
                }
            } else {
                res.json({ message: `No record found for Dealer Meet with ID ${rc_id}` });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




route.get('/manager_dashboard', authenticate, async (req, res) => {

    const pool = await dbConnection();
    let desi =req.session.designation;

    let sql = `SELECT action_url FROM Jacpl_master where action_value = ? `;
    pool.query(sql,[desi],(err, result) => {

     console.log(result,'sdsdiugfi')
        if(err){
            console.log(err)
        }



 
    res.render('manager_dashboard',{result:result})
})
})
route.get('/pending_approval', authenticate, (req, res) => {
    res.render('pending_approval')
})
route.get('/pending_approval_accept', authenticate, (req, res) => {
    res.render('pending_approval_accept')
})




route.get('/duplicate_image_details', authenticate, async (req, res) => {
    try {
        const pool = await dbConnection();

        const query = `SELECT c.rc_id, c.emp_id, c.Event_Photo1, c.Event_Photo2, c.Event_Photo3, DATE_FORMAT(c.DateOfMeet, '%d-%m-%Y') AS DateOfMeet, l.EMP_NAME FROM Jacpl_ContractorMeet AS c JOIN JUBILANT_LOGIN AS l ON c.emp_id = l.emp_code WHERE (c.Event_Photo1 IN (SELECT Event_Photo1 FROM Jacpl_ContractorMeet GROUP BY Event_Photo1 HAVING COUNT(Event_Photo1) > 1) OR c.Event_Photo2 IN (SELECT Event_Photo2 FROM Jacpl_ContractorMeet GROUP BY Event_Photo2 HAVING COUNT(Event_Photo2) > 1) OR c.Event_Photo3 IN (SELECT Event_Photo3 FROM Jacpl_ContractorMeet GROUP BY Event_Photo3 HAVING COUNT(Event_Photo3) > 1)) OR (c.Event_Photo1 IN (SELECT Event_Photo2 FROM Jacpl_ContractorMeet) AND c.Event_Photo2 IS NOT NULL) OR (c.Event_Photo1 IN (SELECT Event_Photo3 FROM Jacpl_ContractorMeet) AND c.Event_Photo3 IS NOT NULL) AND c.is_active = 1;;`;



        pool.query(query, (error, results) => {
            if (error) {
                console.error(error);
                logger.error(error);
                return res.status(500).send('Internal Server Error');
            }
            // console.log(results)
            res.render('duplicate_image_details', { duplicateImageDetails: results });
        });
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).send('Internal Server Error');
    }
});



route.post('/dp_img_srch', async (req, res) => {
    try {
        const pool = await dbConnection();

        let srch = req.body.srch;
        console.log(srch)

        const query = `SELECT c.rc_id, c.emp_id, c.Event_Photo1, c.Event_Photo2, c.Event_Photo3, DATE_FORMAT(c.DateOfMeet, '%d-%m-%Y') AS DateOfMeet, l.EMP_NAME FROM Jacpl_ContractorMeet AS c JOIN JUBILANT_LOGIN AS l ON c.emp_id = l.emp_code WHERE ((c.Event_Photo1 IN (SELECT Event_Photo1 FROM Jacpl_ContractorMeet GROUP BY Event_Photo1 HAVING COUNT(Event_Photo1) > 1) OR c.Event_Photo2 IN (SELECT Event_Photo2 FROM Jacpl_ContractorMeet GROUP BY Event_Photo2 HAVING COUNT(Event_Photo2) > 1) OR c.Event_Photo3 IN (SELECT Event_Photo3 FROM Jacpl_ContractorMeet GROUP BY Event_Photo3 HAVING COUNT(Event_Photo3) > 1)) OR (c.Event_Photo1 IN (SELECT Event_Photo2 FROM Jacpl_ContractorMeet) AND c.Event_Photo2 IS NOT NULL) OR (c.Event_Photo1 IN (SELECT Event_Photo3 FROM Jacpl_ContractorMeet) AND c.Event_Photo3 IS NOT NULL)) AND c.emp_id = '${srch}' AND  c.is_active = 1;`;

        pool.query(query, (error, results) => {
            if (error) {
                console.error(error);
                logger.error(error);
                return res.status(500).send('Internal Server Error');
            }
            // console.log(results)
            res.json({ duplicateImageDetails: results });
        });
    } catch (error) {
        console.error(error);
        logger.error(error);
        res.status(500).send('Internal Server Error');
    }
});





route.post('/dealer_upload', async (req, res) => {
    try {
        const con = await dbConnection();
        const dataFromBody = JSON.parse(req.body.data);

        for (let i = 0; i < dataFromBody.length; i++) {
            let Customer_Code = dataFromBody[i].Customer_Code || null;
            let Customer_Name = dataFromBody[i].Customer_Name || null;
            let Customer_Phone = dataFromBody[i].Customer_Phone || null;
            let Channel_Code = dataFromBody[i].Channel_Code || null;
            let Customer_Type = dataFromBody[i].Customer_Type || null;
            let City = dataFromBody[i].City || null;
            let Contact_Person = dataFromBody[i].Contact_Person || null;

            let selectQuery = `SELECT COUNT(*) AS count FROM dealer_master WHERE Customer_Code = ?`;
            con.query(selectQuery, [Customer_Code], (selectErr, selectResults) => {
                if (selectErr) {
                    console.log(selectErr);
                    logger.error('in upload ageing report selectQuery ::', selectErr);
                } else {
                    if (selectResults[0].count === 0) {
                        let insertQuery = `INSERT INTO dealer_master(Customer_Code, Customer_Name, Customer_Phone, Channel_Code, Customer_Type, City, Contact_Person) VALUES (?,?,?,?,?,?,?)`;
                        con.query(insertQuery, [Customer_Code, Customer_Name, Customer_Phone, Channel_Code, Customer_Type, City, Contact_Person], (insertErr, insertResults) => {
                            if (insertErr) {
                                console.log(insertErr);
                                logger.error('in upload ageing report insertQuery ::', insertErr);
                            } else {
                                // console.log(insertResults);
                            }
                        });
                    } else {
                        let updateQuery = `UPDATE dealer_master SET Customer_Name=?, Customer_Phone=?, Channel_Code=?, Customer_Type=?, City=?, Contact_Person=? WHERE Customer_Code=?`;
                        con.query(updateQuery, [Customer_Name, Customer_Phone, Channel_Code, Customer_Type, City, Contact_Person, Customer_Code], (updateErr, updateResults) => {
                            if (updateErr) {
                                console.log(updateErr);
                                logger.error('in upload ageing report updateQuery ::', updateErr);
                            } else {
                                // console.log('updating same  Data ');
                            }
                        });
                    }
                }
            });
        }

        res.status(200).json({ message: 'Data inserted or updated successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        logger.error('in upload ageing report :: ', err);
    }
});


route.post('/dealer_check_inshop', async (req, res) => {
    try {

        let pool = await dbConnection()
        let dealer_code = req.body.dealer_code

        let query = `SELECT * FROM dealer_master WHERE Customer_Code=?`
        pool.query(query, [dealer_code], (err, results) => {
            if (err) {
                console.log(err)
                logger.error(err)
            } else {
                console.log(results)
                res.json({ data: results })
            }
        })

    } catch (error) {
        console.log(error)
        logger.error(error)
    }
})
route.post('/dealer_check_contractor', async (req, res) => {
    try {

        let pool = await dbConnection()
        let dealer_code = req.body.dealer_code

        let query = `SELECT * FROM dealer_master WHERE Customer_Code=?`
        pool.query(query, [dealer_code], (err, results) => {
            if (err) {
                console.log(err)
                logger.error(err)
            } else {
                console.log(results)
                res.json({ data: results })
            }
        })

    } catch (error) {
        console.log(error)
        logger.error(error)
    }
})
route.post('/dealer_check_sga', async (req, res) => {
    try {

        let pool = await dbConnection()
        let dealer_code = req.body.dealer_code

        let query = `SELECT * FROM dealer_master WHERE Customer_Code=?`
        pool.query(query, [dealer_code], (err, results) => {
            if (err) {
                console.log(err)
                logger.error(err)
            } else {
                console.log(results)
                res.json({ data: results })
            }
        })

    } catch (error) {
        console.log(error)
        logger.error(error)
    }
})
route.post('/dealer_check_dealer', async (req, res) => {
    try {

        let pool = await dbConnection()
        let dealer_code = req.body.no

        let query = `SELECT Customer_Code,Customer_Name FROM dealer_master WHERE Customer_Code=?`
        pool.query(query, [dealer_code], (err, results) => {
            if (err) {
                console.log(err)
                logger.error(err)
            } else {
                console.log(results)
                res.json({ data: results })
            }
        })

    } catch (error) {
        console.log(error)
        logger.error(error)
    }
})




route.get('/jacpl_contractor_meet_details_api', async (req, res) => {
    try {
        const pool = await dbConnection();
        const query = `SELECT Inf_Mobile FROM Jacpl_ContractorMeetDetails WHERE is_active IN ('1')`;

        const results = await new Promise((resolve, reject) => {
            pool.query(query, (err, results) => {
                if (err) {
                    console.error('Error fetching mobile numbers from database:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
//console.log(results.length)
        for (let i = 0; i < results.length; i++) {
            const mobileNumber = results[i].Inf_Mobile;

            let data = qs.stringify({
                'getInfluencerStatusData': `{"msisdn":${mobileNumber}}'`
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://jac.jolcorp.info/LoyaltyApp/api/getInfluencerStatusDataNew',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': 'JSESSIONID=8B78A55B1CE2F30F3A7697E5E8D42639'
                },
                data: data,
		timeout: 15000
            };
//console.log('02')
            axios.request(config)
                .then((response) => {
                    // console.log(JSON.stringify(response.data));

                    const responseData = response.data;

                    let is_active = responseData.userStatus === 'ACTIVE' ? 2 : 0;

                    const updateQuery = `UPDATE Jacpl_ContractorMeetDetails SET Inf_Name = ?, Inf_Type = ?, Inf_City = ?, Inf_AC_Points = ?, Inf_Status = ?, is_active = ? WHERE Inf_Mobile = ?`;
                    //  console.log(updateQuery)
			pool.query(updateQuery, [responseData.name, responseData.influencerType, responseData.city, responseData.totalPoint, responseData.userStatus, is_active, mobileNumber], (err, results) => {
                        if (err) throw err;
                        logger.error(err)
                      // console.log(results,'03')
                    });
                })
                .catch((error) => {
                    console.log(error);
                });
        }

	    res.json({ message: 'Update process initiated for all mobile numbers' });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


//const cron = require('node-cron');

//cron.schedule('*/30 * * * *', async () => {
//    try {
//        const response = await axios.post('http://localhost:8081/jacpl_contractor_meet_details_api');
//        logger.log(response.data);
//    } catch (error) {
//        logger.error('Error occurred:', error);
//    }
//}, {
//    scheduled: true,
//    timezone: 'Asia/Kolkata'
//});




route.post('/is_active_status', async (req, res) => {
    try {
        let pool = await dbConnection();
        let is_active = req.body.is_active;

        let query = `SELECT action_status FROM meet_status WHERE action_id=?`;
        pool.query(query, [is_active], function (err, result) {
            if (err) {
                logger.error(err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                const actionStatus = result.map(row => row.action_status);
                res.json({ actionStatus: actionStatus });
            }
        });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


route.get("/get_data_sga_meet", async (req, res) => {
    try {
        const vertical = req.query.vertical; 
        const ho_gift = req.query.ho_gift;
       
        let settingKey = 'sga-with-gift';
        let settingKey1 = 'sga-without-gift';

        const pool = await dbConnection();

        const sql = `SELECT Gift_Value,Food_Value,SETTING_VALUE FROM MEET_BUDGET WHERE vertical = ? AND (SETTING_KEY = ? OR SETTING_KEY = ?) AND BACKEND_TITLE = ?`;
        pool.query(sql, [vertical,settingKey,settingKey1,ho_gift], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Database query failed' });
            } else {
                console.log(result,'12');
                res.send({ success: true, data: result });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Database connection failed' });
    }
});


route.get("/get_data", async (req, res) => {
    try {
        const vertical = req.query.vertical; 
        const ho_gift = req.query.ho_gift;
       
        let settingKey = 'ContractorMeet-with-gift';
        let settingKey1 = 'ContractorMeet-without-gift';

        const pool = await dbConnection();

        const sql = `SELECT Gift_Value,Food_Value,SETTING_VALUE FROM MEET_BUDGET WHERE vertical = ? AND (SETTING_KEY = ? OR SETTING_KEY = ?) AND BACKEND_TITLE = ?`;
        pool.query(sql, [vertical,settingKey,settingKey1,ho_gift], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Database query failed' });
            } else {
                console.log(result,'12');
                res.send({ success: true, data: result });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Database connection failed' });
    }
});


route.get("/get_data_inshop", async (req, res) => {
    try {
        const vertical = req.query.vertical; 
        const ho_gift = req.query.ho_gift;
       
        let settingKey = 'Inshop-with-gift';
        let settingKey1 = 'Inshop-without-gift';

        const pool = await dbConnection();

        const sql = `SELECT Gift_Value,Food_Value,SETTING_VALUE FROM MEET_BUDGET WHERE vertical = ? AND (SETTING_KEY = ? OR SETTING_KEY = ?) AND BACKEND_TITLE = ?`;
        pool.query(sql, [vertical,settingKey,settingKey1,ho_gift], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Database query failed' });
            } else {
                console.log(result,'12');
                res.send({ success: true, data: result });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Database connection failed' });
    }
});


route.get("/get_data_dealer_meet", async (req, res) => {
    try {
        const vertical = req.query.vertical; 
        const ho_gift = req.query.ho_gift;
       
        let settingKey = 'DealerMeet-with-gift';
        let settingKey1 = 'DealerMeet-without-gift';

        const pool = await dbConnection();

        const sql = `SELECT Gift_Value,Food_Value,SETTING_VALUE FROM MEET_BUDGET WHERE vertical = ? AND (SETTING_KEY = ? OR SETTING_KEY = ?) AND BACKEND_TITLE = ?`;
        pool.query(sql, [vertical,settingKey,settingKey1,ho_gift], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send({ success: false, message: 'Database query failed' });
            } else {
               
                res.send({ success: true, data: result });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: 'Database connection failed' });
    }
});


route.get('/gift-options', async (req, res) => {

    const pool = await dbConnection();
    const query = 'SELECT gift_name FROM jacpl_meet_gifts'; 

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).send('Error fetching data');
            return;
        }
        res.json(results);
    });
});



route.post('/update_voucher',async (req, res) => {
    const { rc_id, voucher_no } = req.body;
    
  
    let pool = await dbConnection();
    const sql = 'UPDATE Jacpl_ContractorMeet SET voucher_no= ? WHERE rc_id= ?';
    pool.query(sql, [voucher_no, rc_id], (err, result) => {
        console.log(result)
      if (err) {
        console.error('Error executing query', err);
        res.status(500).json({ success: false, message: 'Database query failed' });
        return;
      }
      if (result.affectedRows > 0) {
        res.json({ success: true, updatedVoucherNo: voucher_no });
      } else {
        res.json({ success: false, message: 'Record not found' });
      }
    });
  });


  route.get('/attend_approvel',authenticate,async (req,res) => {

    try {
        const emp = req.session.employeeId;
        const pool = await dbConnection();

        const query = `
            SELECT 
                jc.*, 
                DATE_FORMAT(jc.DateOfMeet, '%d-%m-%Y') AS formattedDate,
                jl.EMP_NAME, 
                jl.REP_MANAGER_ID, 
                jl.REP_MANAGER_NAME, 
                jl.BRANCH, 
                jl.ZONE 
            FROM 
                Jacpl_ContractorMeet jc 
                INNER JOIN JUBILANT_LOGIN jl ON jc.emp_id = jl.EMP_CODE
            WHERE 
                jc.is_active = 1 AND
                jl.REP_MANAGER_ID = ?
            ORDER BY 
                jc.rc_id DESC 
            LIMIT 
                20`;

        pool.query(query,[emp], (err, results) => {
            console.log(results,'results')
            if (err) {
                console.error(err);
                logger.error(`Error occurred in GET view_pending_btl for emp_code ${emp}: ${err}`);
                return res.status(500).send('Internal Server Error');
            }

            results.forEach(result => {
                result.DateOfMeet = result.formattedDate;
                delete result.formattedDate;
            });

            res.render('attend_approvel', { data: results });
            logger.info(`GET view_pending_btl accessed for emp_code ${emp}`);
        });

    } catch (error) {
        console.error(error);
        logger.error(`Error occurred in GET view_pending_btl for emp_code ${emp}: ${error}`);
        res.status(500).send('Internal Server Error');
    }


})
route.get('/extra_expense_approval',authenticate,async (req,res) => {

    try {
        const emp = req.session.employeeId;
        const pool = await dbConnection();

        const query = `
            SELECT 
                jc.*, 
                DATE_FORMAT(jc.DateOfMeet, '%d-%m-%Y') AS formattedDate,
                jl.EMP_NAME, 
                jl.REP_MANAGER_ID, 
                jl.REP_MANAGER_NAME, 
                jl.BRANCH, 
                jl.ZONE 
            FROM 
                Jacpl_ContractorMeet jc 
                INNER JOIN JUBILANT_LOGIN jl ON jc.emp_id = jl.EMP_CODE
            WHERE 
                jc.is_active = 1 AND 
                jl.RSM_ZSM_ID = ?
            ORDER BY 
                jc.rc_id DESC 
            LIMIT 
                20`;

        pool.query(query,[emp], (err, results) => {
            if (err) {
                console.error(err);
                logger.error(`Error occurred in GET view_pending_btl for emp_code ${emp}: ${err}`);
                return res.status(500).send('Internal Server Error');
            }

            results.forEach(result => {
                result.DateOfMeet = result.formattedDate;
                delete result.formattedDate;
            });

            res.render('extra_expence_approvel', { data: results });
            logger.info(`GET view_pending_btl accessed for emp_code ${emp}`);
        });

    } catch (error) {
        console.error(error);
        logger.error(`Error occurred in GET view_pending_btl for emp_code ${emp}: ${error}`);
        res.status(500).send('Internal Server Error');
    }

})


 

route.post('/expance_approved', async (req, res) => {
    try {
        const rc_id = req.body.rc_id;
        const emp_name = req.session.emp_Name;

        const pool = await dbConnection();

        // Get the action status
        let statusQuery = `SELECT action_status FROM meet_status WHERE action_value ='Expense Approved'`;
        pool.query(statusQuery, (err, result1) => {
            console.log('Result from status query:', result1); 
            if (err) {
                console.error('Error fetching action status:', err);
                return res.status(500).json({ error: 'Database error fetching action status' });
            }

            if (result1.length === 0) {
                return res.status(404).json({ error: 'Action status not found' });
            }

            let status = result1[0].action_status;
            console.log('Action status:', status);

            let updateQuery = `UPDATE Jacpl_ContractorMeet SET Manager_Approval_date = ?, Manager_Approval_status = ?, Approved_by = ? WHERE rc_id = ?`;
            pool.query(updateQuery, [getCurrentDateAndTime(), status, emp_name, rc_id], (error, result) => {
                console.log('Result from update query:', result); 
                if (error) {
                    res.send('error')
                    console.log('111111')
                }
                else{
                    res.send('success')
                    console.log('222222')
                }

             
            });
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection error' });
    }
});

route.post('/expance_reject', async (req, res) => {
    try {
        const rc_id = req.body.rc_id;
        const emp_name = req.session.emp_Name;
        const pool = await dbConnection();
    
        let statusQuery = `SELECT action_status FROM meet_status WHERE action_value ='Expense Rejected'`;
        pool.query(statusQuery, (err, result1) => {
            console.log('Result from status query:', result1); 
            if (err) {
                console.error('Error fetching action status:', err);
                return res.status(500).json({ error: 'Database error fetching action status' });
            }

            if (result1.length === 0) {
                return res.status(404).json({ error: 'Action status not found' });
            }

            let status = result1[0].action_status;
            console.log('Action status:', status);

            let updateQuery = `UPDATE Jacpl_ContractorMeet SET Manager_Approval_date = ?, Manager_Approval_status = ?, Approved_by = ? WHERE rc_id = ?`;
            pool.query(updateQuery, [getCurrentDateAndTime(), status, emp_name, rc_id], (error, result) => {
                console.log('Result from update query:', result); 
                if (error) {
                  res.send('error')
                }

               res.send('success')
            });
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection error' });
    }
});



module.exports = route;
