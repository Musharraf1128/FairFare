# 💸 TripSplit - Expense Tracker

A full-stack MERN application for managing group trip expenses, similar to Splitwise.

## ✨ Features

- 🔐 **User Authentication** - JWT-based secure authentication
- 🌍 **Trip Management** - Create and manage trips with multiple members
- 💰 **Expense Tracking** - Add, view, and categorize expenses
- ⚖️ **Smart Settlement** - Automatic calculation of who owes whom
- 📊 **Dashboard** - Visual insights with charts and statistics
- 📱 **Responsive Design** - Works seamlessly on all devices

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Chart.js / React-Chartjs-2
- Axios

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd trip-expense-tracker
```

2. **Setup Backend**
```bash
cd server
npm install
```

Create `.env` file in server directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

3. **Setup Frontend**
```bash
cd client
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📖 Usage

1. **Register/Login** - Create an account or login
2. **Create Trip** - Start a new trip and add members
3. **Add Expenses** - Log expenses with custom splits
4. **View Settlement** - See who owes whom
5. **Dashboard** - Track spending patterns and statistics

## 🎯 Key Features Explained

### Smart Settlement Algorithm
The app uses an optimized algorithm to minimize the number of transactions needed to settle all debts within a group.

### Expense Categories
- 🍔 Food
- 🚗 Transport
- 🏨 Accommodation
- 🎉 Entertainment
- 🛍️ Shopping
- 📝 Other

### Real-time Balance Calculation
- Individual balances (paid vs share)
- Color-coded indicators (green = owed, red = owes)
- Detailed transaction breakdown

## 📸 Screenshots

[Add screenshots of your application here]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Inspired by Splitwise
- Built as part of a college project
