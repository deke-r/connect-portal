module.exports = {
	user : process.env.NODE_ORACLEDB_USER || "FIELDAPP",

	password : process.env.NODE_ORACLEDB_PASSWORD || "F13lda9p#deV#",

	connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "(DESCRIPTION = (ADDRESS = (PROTOCOL = tcp)(HOST = 10.116.209.27 )(PORT = 1521)) (CONNECT_DATA = (SERVER = DEDICATED) (SERVICE_NAME = fmdevpdb.fmnonproddbsn.fmnonprodvcn.oraclevcn.com )))",

	externalAuth : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};
