try {
    const ctrl = require('./controllers/usersController');
    console.log('usersController exports:', Object.keys(ctrl));
    if (!ctrl.addCertification) console.error('addCertification is MISSING');
    if (!ctrl.deleteCertification) console.error('deleteCertification is MISSING');
    if (!ctrl.getUserPosts) console.error('getUserPosts is MISSING');
} catch (e) {
    console.error(e);
}
