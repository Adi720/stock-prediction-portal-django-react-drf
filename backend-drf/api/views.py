from django.shortcuts import render
from rest_framework.views import APIView
from .serializers import StockPredictionSerializer
from rest_framework import status
from rest_framework.response import Response
import yfinance as yf
import pandas as pd 
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime 
import os
from dotenv import load_dotenv  # <-- ADD THIS
load_dotenv()
from django.conf import settings
from .utils import save_plot
from sklearn.preprocessing import MinMaxScaler
from keras.models import load_model
from sklearn.metrics import mean_squared_error, r2_score
from django.core.cache import cache

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
import requests
import xml.etree.ElementTree as ET
# Using APIView as we get full control
# Load ML Model
model = load_model('stock_prediction_model.keras')
class StockPredictionAPIView(APIView):
    def post(self, request):
        serializer = StockPredictionSerializer(data=request.data)
        if serializer.is_valid():
            ticker = serializer.validated_data['ticker']

            # Step 1: Create unique cache key
            cache_key = f"stock_{ticker}"

            # Step 2: Check cache
            cached_data = cache.get(cache_key)

            if cached_data:
                return Response({
                    'status': 'success',
                    'source': 'cache',
                    **cached_data
                })

            #Fetch data from yfinance 
            now = datetime.now()
            start = datetime(now.year-10, now.month, now.day)
            end = now
            df = yf.download(ticker, start, end)
            print(df)
            if df.empty:
                return Response({"error": "No data found for the given ticker", 'status': status.HTTP_404_NOT_FOUND})
            # as the default index first column is date but we want the first column to be index to know no of records 
            df = df.reset_index()
            
            # Generate Plot 
            plt.switch_backend('AGG') # So this AGG Backend would generate a png image to store plot unlinke jupyter notebook where we directly got plot thats why switched the backend 
            plt.figure(figsize=(12,5))
            plt.plot(df.Close, label='Closing Price')
            plt.title(f"Closing Price of {ticker}")
            plt.xlabel('Days')
            plt.ylabel('Close price')
            plt.legend()

            # Save the Plot to a File 
            plot_img_path = f'{ticker}_plot.png'
            plot_img = save_plot(plot_img_path)

            #100 Days Moving Average 
            ma100 = df.Close.rolling(100).mean()
            plt.switch_backend('AGG') # So this AGG Backend would generate a png image to store plot unlinke jupyter notebook where we directly got plot thats why switched the backend 
            plt.figure(figsize=(12,5))
            plt.plot(df.Close, label='Closing Price')
            plt.plot(ma100, 'r', label='100 DMA')
            plt.title(f"100 Days Moving Average of {ticker}")
            plt.xlabel('Days')
            plt.ylabel('Close price')
            plt.legend()
            plot_img_path = f'{ticker}_100_dma.png'
            plot_100_dma = save_plot(plot_img_path)

            #200 Days Moving Average 
            ma200 = df.Close.rolling(200).mean()
            plt.switch_backend('AGG') # So this AGG Backend would generate a png image to store plot unlinke jupyter notebook where we directly got plot thats why switched the backend 
            plt.figure(figsize=(12,5))
            plt.plot(df.Close, label='Closing Price')
            plt.plot(ma100, 'r', label='100 DMA')
            plt.plot(ma200, 'g', label='200 DMA')
            plt.title(f"200 Days Moving Average of {ticker}")
            plt.xlabel('Days')
            plt.ylabel('Close price')
            plt.legend()
            plot_img_path = f'{ticker}_200_dma.png'
            plot_200_dma = save_plot(plot_img_path)

            # Splitting the Data into Training and Testing datasets
            data_training = pd.DataFrame(df.Close[0:int(len(df)*0.7)])
            data_testing = pd.DataFrame(df.Close[int(len(df)*0.7): int(len(df))])

            # Scaling down the data between 0 and 1 
            scaler = MinMaxScaler(feature_range=(0,1))


            #Preparing Test Data
            past_100_days = data_training.tail(100)
            final_df = pd.concat([past_100_days, data_testing], ignore_index=True)
            input_data = scaler.fit_transform(final_df)

            x_test = []
            y_test = []

            for i in range(100, input_data.shape[0]):
                x_test.append(input_data[i-100: i])
                y_test.append(input_data[i, 0])
            x_test, y_test = np.array(x_test), np.array(y_test)

            # Making Predictions 
            y_predicted = model.predict(x_test)

            # Revert the scaled prices to original price
            y_predicted = scaler.inverse_transform(y_predicted.reshape(-1, 1)).flatten()
            y_test = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()

            #Plot the final Prediction
            plt.switch_backend('AGG') # So this AGG Backend would generate a png image to store plot unlinke jupyter notebook where we directly got plot thats why switched the backend 
            plt.figure(figsize=(12,5))
            plt.plot(y_test, 'b', label='Original Price')
            plt.plot(y_predicted, 'r', label='Predicted Price')
            plt.title(f"Final Prediction for the {ticker}")
            plt.xlabel('Days')
            plt.ylabel('Close price')
            plt.legend()
            plot_img_path = f'{ticker}_final_prediction.png'
            plot_prediction = save_plot(plot_img_path)

            #Model Evaluation
            # Mean Squared Error (MSE)
            mse = mean_squared_error(y_test, y_predicted)

            # Root Mean Squared Error (RMSE)
            rmse = np.sqrt(mse)

            # R-Squared
            r2 = r2_score(y_test, y_predicted)
# --- AI INSIGHT GENERATION ---
            ai_insight = "AI Market Insight could not be generated at this time."
            try:
                # 1. Fetch Top 3 Recent News Headlines (Bulletproof RSS Method)
                news_text = "No recent news available."
                try:
                    rss_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US"
                    # Use the robust 'requests' library to spoof a browser
                    response = requests.get(rss_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
                    
                    if response.status_code == 200:
                        root = ET.fromstring(response.content)
                        headlines = []
                        
                        # Dig into the XML tree and grab the first 3 'title' tags
                        for item in root.findall('.//channel/item')[:3]:
                            if item.find('title') is not None:
                                headlines.append(item.find('title').text)
                                
                        if headlines:
                            news_text = " | ".join(headlines)
                except Exception as news_e:
                    print(f"News Fetch Error: {news_e}")

                # 2. Setup LangChain Prompt
                val_prediction = float(np.ravel(y_predicted)[-1]) if len(y_predicted) > 0 else 0.0
                val_ma100 = float(np.ravel(ma100)[-1]) if len(ma100) > 0 else 0.0

                prompt_template = """
                You are a highly technical quantitative and fundamental financial analyst.

                Stock Ticker: {ticker}
                Our LSTM Model Predicts the next price as: {latest_prediction}
                Current 100-Day Moving Average: {latest_ma100}
                Latest News Headlines: {news}

                Task:
                Provide a highly specific, 3-sentence market insight.
                - Analyze whether the recent news headlines explain the trend predicted by the LSTM model.
                - Explicitly reference the numerical values provided.
                - If no news is available, base reasoning only on prediction vs moving average.

                IMPORTANT:
                Return the response in the following structured format:

                STRICT FORMAT:

                Summary:
                <one clear sentence>

                Key Drivers:
                - <point 1>
                - <point 2>

                Risk Factors:
                - <point 1>
                - <point 2>

                Sentiment: <Bullish/Bearish/Neutral>

                Do not add content outside these sections.
                """
                
                prompt = PromptTemplate.from_template(prompt_template)
                
                # 3. Call Groq LLaMA 3 Model
                llm = ChatGroq(
                    groq_api_key=os.environ.get('GROQ_API_KEY'), 
                    model_name="llama-3.1-8b-instant"
                )
                
                chain = prompt | llm
                ai_response = chain.invoke({
                    "ticker": ticker,
                    "latest_prediction": f"${val_prediction:.2f}",
                    "latest_ma100": f"${val_ma100:.2f}",
                    "news": news_text
                })
                
                ai_insight = ai_response.content
            except Exception as e:
                print(f"AI Generation Error: {e}")
            # --- END AI INSIGHT ---

            response_data = {
                'dates': df['Date'].astype(str).tolist(),
                'close_prices': df['Close'].values.flatten().tolist(),
                'ma100': ma100.fillna(0).values.flatten().tolist(),
                'ma200': ma200.fillna(0).values.flatten().tolist(),
                'y_test': y_test.flatten().tolist(),
                'y_predicted': y_predicted.flatten().tolist(),

                'mse': mse,
                'rmse': rmse,
                'r2': r2,

                'plot_img': plot_img,
                'plot_100dma': plot_100_dma,
                'plot_200dma': plot_200_dma,
                'plot_prediction': plot_prediction,
                'ai_insight': ai_insight
            }

            cache.set(cache_key, response_data, timeout=600)

            return Response({
                'status': 'success',
                'source': 'api',
                **response_data
            })
            


