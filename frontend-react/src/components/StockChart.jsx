import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Legend,
    Tooltip
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Legend,
    Tooltip
)

const StockChart = ({ labels, datasets }) => {

    const data = {
        labels: labels,
        datasets: datasets
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    display: false
                }
            },
            tooltip: {
                backgroundColor: '#020617',
                borderColor: '#334155',
                borderWidth: 1,
                titleColor: '#fff',
                bodyColor: '#fff'
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#aaa',
                    maxTicksLimit: 6
                },
                grid: {
                    display: false
                }
            },
            y: {
                ticks: {
                    color: '#aaa'
                },
                grid: {
                    color: 'rgba(255,255,255,0.05)'
                }
            }
        }
    }

    return (
        <div style={{ height: '350px', maxWidth: '900px', margin: '0 auto' }}>
            <Line data={data} options={options} />
        </div>
    )
}

export default StockChart