# 📈 Stock Prediction Portal

A full-stack machine learning web application that predicts stock prices using deep learning techniques. The system leverages historical stock data and applies an LSTM-based neural network to forecast future trends.

---

## 🧠 Project Overview

This project combines **Machine Learning + Full Stack Development** to deliver an end-to-end stock prediction platform.

* 📊 Uses historical stock data for prediction
* 🤖 Implements **LSTM (Long Short-Term Memory)** model using Keras
* 🌐 Full-stack architecture with Django REST APIs and React frontend
* 📈 Visualizes stock trends and predictions with interactive graphs

---

## ⚙️ Tech Stack

### 🔹 Backend

* Python
* Django
* Django REST Framework

### 🔹 Frontend

* React.js
* HTML, CSS, JavaScript

### 🔹 Machine Learning

* TensorFlow / Keras
* Pandas, NumPy, Matplotlib
* Scikit-learn

---

## ✨ Features

* 🔐 User Authentication (Login/Register)
* 📥 Input stock ticker (e.g., GOOG, AAPL)
* 📊 Visualize:

  * Closing price trends
  * 100-day moving average
  * 200-day moving average
* 🤖 LSTM-based stock price prediction
* 📉 Model evaluation metrics:

  * MSE
  * RMSE
  * R² Score

---

## 📸 Application Screenshots

### 🏠 Landing Page

![Landing Page](./screenshots/landing.png)

### 🔐 Login Page

![Login](./screenshots/login.png)

### 📊 Dashboard Input

![Dashboard](./screenshots/dashboard.png)

### 📈 Stock Trends

![Charts](./screenshots/chart1.png)

### 📉 Moving Averages

![Moving Average](./screenshots/chart2.png)

### 🤖 Prediction Output

![Prediction](./screenshots/prediction.png)

---

## 🏗️ System Architecture

```
React Frontend  →  Django REST API  →  ML Model (Keras LSTM)
                                ↓
                          Data Processing (Pandas)
```

---

## 🧪 Model Details

* Model Type: LSTM (Recurrent Neural Network)
* Input Features:

  * Historical closing prices
  * Moving averages (100-day, 200-day)
* Data Scaling: MinMaxScaler
* Evaluation Metrics:

  * Mean Squared Error (MSE)
  * Root Mean Squared Error (RMSE)
  * R² Score

---

## 🔗 API Endpoints

| Endpoint         | Method | Description          |
| ---------------- | ------ | -------------------- |
| `/api/register/` | POST   | Register user        |
| `/api/token/`    | POST   | Login (JWT)          |
| `/api/predict/`  | POST   | Get stock prediction |

---

## 👨‍💻 Author

**Aditya More**

---
