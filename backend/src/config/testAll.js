import { getConnection, DBNAMES } from "./dbPool.js";
getConnection(DBNAMES.USER);
getConnection(DBNAMES.ITEM);
getConnection(DBNAMES.PAYMENT);
getConnection(DBNAMES.TOKEN);
getConnection(DBNAMES.PROFILE);
setTimeout(() => process.exit(0), 800);
