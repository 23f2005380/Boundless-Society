import bcrypt from "bcryptjs"

bcrypt.hash("admin@123", 10).then(console.log)