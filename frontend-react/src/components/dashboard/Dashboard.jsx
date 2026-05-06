import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '../../axiosInstance'
import StockChart from '../StockChart'

const Dashboard = () => {

    const accessToken = localStorage.getItem('accessToken')

    const [ticker, setTicker] = useState('')
    const [error, setError] = useState()
    const [loading, setLoading] = useState(false)
    const [plot, setPlot] = useState()
    const [ma100, setMA100] = useState()
    const [ma200, setMA200] = useState()
    const [prediction, setPrediction] = useState()
    const [mse, setMSE] = useState()
    const [rmse, setRMSE] = useState()
    const [r2, setR2] = useState()
    const [chartData, setChartData] = useState(null)
    const [aiInsight, setAiInsight] = useState()
    const [typedText, setTypedText] = useState('')
    const [showStructured, setShowStructured] = useState(false)


    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const response = await axiosInstance.get('/protected-view/')
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }
        fetchProtectedData()
    }, [])


    const cleanText = (text) => {
        if (!text) return text

        return text
            .replace(/\*\*/g, '')   // remove markdown bold
            .replace(/•/g, '-')     // normalize bullets
            .replace(/\r/g, '')
            .trim()
    }

    useEffect(() => {
        if (!aiInsight) return;

        setShowStructured(false);

        let index = 0;
        const words = aiInsight.split(' ');

        const interval = setInterval(() => {
            const chunk = words.slice(index, index + 5).join(' ');
            setTypedText(prev => prev + (prev ? ' ' : '') + chunk);

            index += 5;

            if (index >= words.length) {
                clearInterval(interval);

                // 🔥 delay before switching UI
                setTimeout(() => {
                    setShowStructured(true);
                }, 400);
            }
        }, 120);

        return () => clearInterval(interval);

    }, [aiInsight]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTypedText('');
        setAiInsight(null);
        setLoading(true)
        try {
            const response = await axiosInstance.post('/predict/', {
                ticker: ticker
            });
            console.log(response.data)
            const backendRoot = import.meta.env.VITE_BACKEND_ROOT
            const plotUrl = `${backendRoot}${response.data.plot_img}`
            const ma100Url = `${backendRoot}${response.data.plot_100dma}`
            const ma200Url = `${backendRoot}${response.data.plot_200dma}`
            const predictionUrl = `${backendRoot}${response.data.plot_prediction}`
            setPlot(plotUrl)
            setMA100(ma100Url)
            setMA200(ma200Url)
            setPrediction(predictionUrl)
            setMSE(response.data.mse)
            setRMSE(response.data.rmse)
            setR2(response.data.r2)
            setAiInsight(response.data.ai_insight)
            // set plots 
            setChartData({
                dates: response.data.dates,
                close_prices: response.data.close_prices,
                ma100: response.data.ma100,
                ma200: response.data.ma200,
                y_test: response.data.y_test,
                y_predicted: response.data.y_predicted
            })
            console.log("DATES:", response.data.dates?.slice(0, 5))
            console.log("PRICES:", response.data.close_prices?.slice(0, 5))
            if (response.data.error) {
                setError(response.data.error)
            }

        } catch (error) {
            console.error('There was an error making the API request', error)
        } finally {
            setLoading(false)
        }
    }
    const formatInsight = (text) => {
        if (!text) return {}

        const getSection = (label) => {
            const regex = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|$)`, 'i')
            const match = text.match(regex)
            return match ? match[1].trim() : ''
        }

        return {
            summary: getSection('Summary'),
            keyDrivers: getSection('Key Drivers'),
            riskFactors: getSection('Risk Factors'),
            sentiment: (text.match(/Sentiment:\s*(.*)/i)?.[1] || '').trim()
        }
    }

    const insight = formatInsight(showStructured ? typedText : '')
    return (
        <div className='container'>
            <div className="row">
                <div className="col-md-6 mx-auto">
                    <form onSubmit={handleSubmit}>
                        <input type='text' className='form-control' placeholder='Enter Stock Ticker'
                            onChange={(e) => setTicker(e.target.value)} required
                        />
                        <small>{error && <div className='text-danger'>{error}</div>}</small>
                        <button type='submit' className='btn btn-info mt-3'>
                            {loading ? <span><FontAwesomeIcon icon={faSpinner} spin />Please Wait..</span> : 'See Prediction'}
                        </button>
                    </form>
                </div>

                {/* ✨ AI Market Insight Card */}
                {aiInsight && (
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            borderLeft: '4px solid #3b82f6',
                            padding: '24px',
                            borderRadius: '12px',
                            marginTop: '25px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                            color: '#e2e8f0'
                        }}
                    >
                        <h4 style={{ color: '#60a5fa', marginBottom: '15px', fontWeight: '600' }}>
                            ✨ AI Market Insight
                        </h4>
                        <div style={{ fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '15px' }}>

                            {/* 🔥 While typing → show raw text */}
                            {!showStructured && (
                                <p style={{ opacity: 0.8 }}>
                                    {typedText}
                                </p>
                            )}

                            {/* ✅ After typing → show structured UI */}
                            {showStructured && (
                                <>
                                    {insight.summary && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong style={{ color: '#93c5fd' }}>📌 Summary: </strong>
                                            {insight.summary}
                                        </div>
                                    )}

                                    {insight.keyDrivers && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong style={{ color: '#93c5fd' }}>📊 Key Drivers: </strong>
                                            {insight.keyDrivers}
                                        </div>
                                    )}

                                    {insight.riskFactors && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong style={{ color: '#93c5fd' }}>⚠️ Risk Factors: </strong>
                                            {insight.riskFactors}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div style={{
                            display: 'inline-block',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            background:
                                insight.sentiment === 'Bullish'
                                    ? 'rgba(34,197,94,0.15)'
                                    : insight.sentiment === 'Bearish'
                                        ? 'rgba(239,68,68,0.15)'
                                        : 'rgba(148,163,184,0.15)',
                            color:
                                insight.sentiment === 'Bullish'
                                    ? '#22c55e'
                                    : insight.sentiment === 'Bearish'
                                        ? '#ef4444'
                                        : '#94a3b8',
                            fontWeight: '600'
                        }}>
                            {insight.sentiment || 'Neutral'}
                        </div>
                    </div>
                )}
                {/* Print Prediction Plots */}
                {chartData?.close_prices?.length > 0 && (
                    <div className="col-12 mt-4">

                        {/* 📊 Closing + MA Chart */}
                        <div style={{
                            background: '#0f172a',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                        }}>
                            <h4 style={{ color: '#fff', marginBottom: '15px', fontWeight: '600' }}>
                                📊 Price Analysis
                            </h4>

                            <StockChart
                                labels={chartData.dates.slice(-150)}
                                datasets={[
                                    {
                                        label: 'Closing Price',
                                        data: chartData.close_prices.slice(-150),
                                        borderColor: '#ffffff',
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.4
                                    },
                                    {
                                        label: '100 DMA',
                                        data: chartData.ma100.slice(-150),
                                        borderColor: '#ef4444',
                                        borderWidth: 1.5,
                                        pointRadius: 0,
                                        tension: 0.4
                                    },
                                    {
                                        label: '200 DMA',
                                        data: chartData.ma200.slice(-150),
                                        borderColor: '#22c55e',
                                        borderWidth: 1.5,
                                        pointRadius: 0,
                                        tension: 0.4
                                    }
                                ]}
                            />
                        </div>

                        {/* 🤖 Prediction Chart */}
                        <div style={{
                            background: '#0f172a',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ color: '#fff', marginBottom: '15px' }}>
                                🤖 Model Prediction
                            </h4>

                            <StockChart
                                labels={Array.from({ length: chartData.y_test.length }, (_, i) => i)}
                                datasets={[
                                    {
                                        label: 'Actual Price',
                                        data: chartData.y_test,
                                        borderColor: '#3b82f6',
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.4
                                    },
                                    {
                                        label: 'Predicted Price',
                                        data: chartData.y_predicted,
                                        borderColor: '#f59e0b',
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.4
                                    }
                                ]}
                            />
                        </div>

                        {/* 📈 Metrics */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '20px'
                        }}>
                            {[
                                { label: 'MSE', value: mse },
                                { label: 'RMSE', value: rmse },
                                { label: 'R² Score', value: r2 }
                            ].map((item, i) => (
                                <div key={i} style={{
                                    background: '#0f172a',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                }}>
                                    <h5 style={{ color: '#9ca3af', marginBottom: '10px' }}>
                                        {item.label}
                                    </h5>
                                    <h3 style={{ color: '#fff', margin: 0 }}>
                                        {item.value?.toFixed(4)}
                                    </h3>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard