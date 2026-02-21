const Company = require("../models/Company");
const User = require("../models/User");

exports.getCompanyStats = async (req, res) => {
  try {
    const companies = await Company.find().populate("employees");
    const result = companies.map(c => ({
      name: c.name,
      employees: c.employees.length,
      avgScore: c.employees.length ? 
        (c.employees.reduce((sum, u) => sum + u.stats.score, 0) / c.employees.length) : 0
    }));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
