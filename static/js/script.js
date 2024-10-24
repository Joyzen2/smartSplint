const patients = [
    {
        name: 'John Doe',
        age: 30,
        gender: 'Male',
        phone: '123-456-7890',
        // avatar: 'img/patient1.jpg',
        sensors: {
            temperature: 0,
            humidity: 0,
            proximalPressure: 0,
            breakPressure: 0,
            distalPressure: 0
        }
    },
    // 更多患者对象
];

// 显示患者的姓名
function displayPatients() {
    const patientList = document.getElementById('patientList');
    patientList.innerHTML = '';
    patients.forEach((patient) => {
        const li = document.createElement('li');
        li.textContent = patient.name;
        patientList.appendChild(li);
    });
}

// 显示患者的详细信息和传感器参数
function viewDetail(patient) {
    document.getElementById('patientName').textContent = patient.name;
    document.getElementById('patientAge').textContent = patient.age;
    document.getElementById('patientGender').textContent = patient.gender;
    document.getElementById('patientPhone').textContent = patient.phone;
    // document.getElementById('patientAvatar').src = patient.avatar;
    document.getElementById('temperatureData').textContent = patient.sensors.temperature + " °C";
    document.getElementById('humidityData').textContent = patient.sensors.humidity + " %";
    document.getElementById('proximalPressureData').textContent = patient.sensors.proximalPressure;
    document.getElementById('breakPressureData').textContent = patient.sensors.breakPressure;
    document.getElementById('distalPressureData').textContent = patient.sensors.distalPressure;
}

document.getElementById('viewDetailBtn').addEventListener('click', function () {
    const patientInfoContainer = document.querySelector('.patient-info-container');
    const sensorData = document.querySelector('.sensor-data');
    const historyCharts = document.querySelector('.historyChart-container');

    // 显示 patientInfoContainer 和 sensorData，隐藏 historyCharts
    patientInfoContainer.style.display = 'flex';
    sensorData.style.display = 'block';
    historyCharts.style.display = 'none';
});

document.getElementById('viewHistoryBtn').addEventListener('click', function () {
    const patientInfoContainer = document.querySelector('.patient-info-container');
    const sensorData = document.querySelector('.sensor-data');
    const historyCharts = document.querySelector('.historyChart-container');

    // 显示 historyCharts，隐藏 patientInfoContainer 和 sensorData
    patientInfoContainer.style.display = 'none';
    sensorData.style.display = 'none';
    historyCharts.style.display = 'flex';
});


viewDetail(patients[0]);

// MQTT连接配置
const subscribedTopic = "111";                  // 订阅主题
const server = 'ws://47.100.114.32:8083/mqtt';
const options = {
    clientId: 'sensorData',
    keepalive: 60,
    clean: true,
    protocolVersion: 5,
    reconnectPeriod: 1000,
    username: '123',
    password: '123456'
};

// 连接到MQTT服务器
const mqttClient = mqtt.connect(server, options);
mqttClient.on('connect', function () {
    console.log('Connected to MQTT server Successfully!');
    document.getElementById('statusText').textContent = "Connected";

    mqttClient.subscribe(subscribedTopic, function (err) {
        if (!err) {
            console.log('Subscribed to ' + subscribedTopic + " topic");
        } else {
            console.log("Subscription error: " + err);
        }
    });
});

// 每当 MQTT 服务器发送一条新消息到你订阅的主题时，这段代码都会被触发并执行 
// 实时传感器数据同步更新
// MQTT消息处理
mqttClient.on('message', function (topic, message) {
    if (topic === subscribedTopic) {

        // message = 26, 55, 3739, 1684: (temp, humi, pressure1, pressure2)
        message = message.toString();

        // 解析 message 为数组
        const values = message.split(',').map(val => parseInt(val.trim()));
        if (values.length === 4) {
            // 创建数据对象
            const data = {
                temperature: values[0],
                humidity: values[1],
                proximalPressure: values[2],
                breakPressure: values[3],
                distalPressure: 0
            };
            console.log('Received data: ', data);
            updateSensorData(data);
        } else {
            console.log('Invalid message format');
        }
    }
});
// 更新传感器数据
function updateSensorData(data) {
    const patient = patients[0];
    patient.sensors.temperature = data.temperature;
    patient.sensors.humidity = data.humidity;
    patient.sensors.proximalPressure = data.proximalPressure;
    patient.sensors.breakPressure = data.breakPressure;
    patient.sensors.distalPressure = data.distalPressure;

    updateProximalDataFb(patient.sensors.proximalPressure);
    updateBreakDataFb(patient.sensors.breakPressure);
    updateDistalDataFb(patient.sensors.distalPressure);
    viewDetail(patient);
}

function updateProximalDataFb(proximalPressure) {
    updateFeedback('proximalDataFeedback', 'proximalProgress', proximalPressure);
}

function updateBreakDataFb(breakPressure) {
    updateFeedback('breakDataFeedback', 'breakProgress', breakPressure);
}

function updateDistalDataFb(distalPressure) {
    updateFeedback('distalDataFeedback', 'distalProgress', distalPressure);
}

function updateFeedback(feedbackId, progressId, pressure) {
    const descriptionElement = document.getElementById(feedbackId);
    const feedbackResults = determineValue(pressure);
    descriptionElement.textContent = feedbackResults.feedbackText;
    descriptionElement.style.color = feedbackResults.color;

    // 得到进度条长度
    const width = getProgress(pressure);

    const progressElement = document.getElementById(progressId);
    progressElement.style.background = feedbackResults.color;
    progressElement.style.width = width;
}

function getProgress(pressureData) {
    // 设置pressureData最大值
    const maxPressureValue = 5000;

    pressureData = Math.min(pressureData, maxPressureValue);
    const progressPercentage = (pressureData / maxPressureValue) * 100;
    return progressPercentage + "%";
}


function determineValue(sensorPressure) {
    let feedbackText = "";
    let color = "";

    let interval_1 = 1000;
    let interval_2 = 2000;
    let interval_3 = 3000;
    let interval_4 = 4000;

    if (sensorPressure >= 0 && sensorPressure < interval_1) {
        feedbackText = "过低";
        color = "#f25858f9";
    } else if (sensorPressure >= interval_1 && sensorPressure < interval_2) {
        feedbackText = "较低";
        color = "#f4857bb3";
    } else if (sensorPressure >= interval_2 && sensorPressure < interval_3) {
        feedbackText = "正常";
        color = "#2dabfabd";
    } else if (sensorPressure >= interval_3 && sensorPressure < interval_4) {
        feedbackText = "较高";
        color = "#f4857bb3";
    } else if (sensorPressure >= interval_4) {
        feedbackText = "过高";
        color = "#f25858f9";
    }

    return { feedbackText, color };
}

// 加载历史数据，获取折线图
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('viewHistoryBtn').addEventListener('click', function() {
        // 当点击“View History”按钮时，获取历史数据
        fetch('/api/history')
            .then(response => response.json())  // 将响应转换为 JSON 格式
            .then(data => {
                const commonOptions = {
                    scales: {
                        x: {
                            display: false  // 隐藏X轴
                        }
                    }
                };

                // 创建并显示温度和湿度的折线图
                const ctx1 = document.getElementById('temperatureHumidityChart').getContext('2d');
                new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: data.map(item => item.date),  // X 轴标签，使用日期
                        datasets: [{
                            label: 'Temperature',
                            data: data.map(item => item.temperature),  // 温度数据
                            borderColor: 'rgb(255, 99, 132)',  // 线条颜色
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',  // 背景颜色
                        }, {
                            label: 'Humidity',
                            data: data.map(item => item.humidity),  // 湿度数据
                            borderColor: 'rgb(54, 162, 235)',  // 线条颜色
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',  // 背景颜色
                        }]
                    },
                    options: commonOptions
                });

                // 创建并显示近端压力折线图
                const ctx2 = document.getElementById('proximalPressureChart').getContext('2d');
                new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: data.map(item => item.date),  // X 轴标签，使用日期
                        datasets: [{
                            label: 'Proximal Pressure',
                            data: data.map(item => item.proximalPressure),  // 近端压力数据
                            borderColor: 'rgb(75, 192, 192)',  // 线条颜色
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',  // 背景颜色
                        }]
                    },
                    options: commonOptions
                });

                // 创建并显示断裂压力折线图
                const ctx3 = document.getElementById('breakPressureChart').getContext('2d');
                new Chart(ctx3, {
                    type: 'line',
                    data: {
                        labels: data.map(item => item.date),  // X 轴标签，使用日期
                        datasets: [{
                            label: 'Break Pressure',
                            data: data.map(item => item.breakPressure),  // 断裂压力数据
                            borderColor: 'rgb(153, 102, 255)',  // 线条颜色
                            backgroundColor: 'rgba(153, 102, 255, 0.5)',  // 背景颜色
                        }]
                    },
                    options: commonOptions
                });

                // 创建并显示远端压力折线图
                const ctx4 = document.getElementById('distalPressureChart').getContext('2d');
                new Chart(ctx4, {
                    type: 'line',
                    data: {
                        labels: data.map(item => item.date),  // X 轴标签，使用日期
                        datasets: [{
                            label: 'Distal Pressure',
                            data: data.map(item => item.distalPressure),  // 远端压力数据
                            borderColor: 'rgb(255, 159, 64)',  // 线条颜色
                            backgroundColor: 'rgba(255, 159, 64, 0.5)',  // 背景颜色
                        }]
                    },
                    options: commonOptions
                });
            })
            .catch(error => console.error('Error fetching history:', error));  // 处理错误
    });
});
