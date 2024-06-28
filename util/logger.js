const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const dotenv=require('dotenv')
dotenv.config({ path: './config.env' });

const logDirectory = process.env.LOG_DIRECTORY;
// const logDirectory = '/var/log/jubilant/activity_images'; 
// const logDirectory = '/var/log/jubilant'; 
const customFormat = combine(
    timestamp(),
    printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
    })
);

const logger = createLogger({
    level: 'info', 
    format: customFormat,
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: path.join(logDirectory, '%DATE%-error.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            dirname: logDirectory
        }),
        new DailyRotateFile({
            filename: path.join(logDirectory, '%DATE%-combined.log'),
            datePattern: 'YYYY-MM-DD',
            dirname: logDirectory
        })
    ]
});

module.exports = logger;
