/**
 * Authenticates the user - currently just checks the existence of the cookie 
 * Authenticated users will have their information stored in req.user
 * @param {Request} req 
 * @param {Response} res
 * @param {Function} next
 */
exports.authenticate = function (req, res, next) {
    // TODO: Change when integrated with SSO
    var netID = req.cookies.netID;
    if (!netID) 
        return routeHelper.sendError(res, null, 'Forbidden - No netID provided', 403);
    req.user = { netID: netID };
    next();
};