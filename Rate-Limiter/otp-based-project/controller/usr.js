const ErrorResponse = require('../ErrorResponse');
const user = [];

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please fill the required details' });
        }

        // Corrected logic to check if user already exists
        const isUserAlreadyExist = user.find((element) => element.username === username);

        if (isUserAlreadyExist) {
            return res.status(400).json({ success: false, message: 'User already exists.' });
        }

        user.push(req.body);

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        // Proper error handling
        res.status(500).json({ success: false, message: err.message });
    }
};