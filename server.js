const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

const API_KEY = process.env.API_KEY || 'a2e73fa6-c7c0-4367-a800-6135a53e424c';
const API_URL = process.env.API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 检查是否在Vercel环境中
const isVercel = !!process.env.VERCEL;

// 处理API请求的函数 - 适用于Vercel无服务器环境
async function handleApiRequest(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 处理API请求
    if (req.method === 'POST' && (req.url === '/api/generate-names' || req.url === '/generate-names')) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const { chineseName } = JSON.parse(body);
                
                if (!chineseName || chineseName.trim() === '') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: '请输入有效的中文名字' }));
                    return;
                }
                
                // 调用DeepSeek API
                const englishNames = await callDeepSeekAPI(chineseName.trim());
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ names: englishNames }));
                
            } catch (error) {
                console.error('Error processing request:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '服务器内部错误' }));
            }
        });
        
        return;
    }
    
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// 服务静态文件
function serveStaticFile(res, filePath, contentType) {
    const fs = require('fs');
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

        return;
    }
    
    // 默认404响应
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
}

// 调用DeepSeek API
function callDeepSeekAPI(chineseName) {
    return new Promise((resolve, reject) => {
        // 首先检查API密钥是否有效
        if (!API_KEY || API_KEY === 'a2e73fa6-c7c0-4367-a800-6135a53e424c') {
            console.log('使用备用英文名生成（API密钥可能无效）');
            resolve(generateEnhancedFallbackNames(chineseName));
            return;
        }

        const prompt = `你是一位专业的英文名生成专家，拥有深厚的语言学和文化背景知识。请为中文名"${chineseName}"生成3个精心设计的英文名。

## 核心要求：

### 1. 英文名质量要求
- 发音优美流畅，与中文名有音译或意译联系
- 名字要具有文化深度和时代感
- 避免过于常见或过时的名字
- 考虑名字的国际适用性

### 2. 中文寓意解释（要求深度和专业性）
- 详细解析名字的语源学背景
- 说明名字在不同文化中的象征意义
- 分析名字的音韵美感和节奏感
- 阐述名字与个人气质的契合度
- 提供名字在文学、历史或神话中的典故

### 3. 英文寓意解释（要求专业和优雅）
- 用优雅的英文描述名字的含义和象征
- 包含名字的词源学分析
- 说明名字的文化内涵和现代意义
- 描述名字给人的第一印象和气质联想

### 4. 幽默说明（要求智慧和趣味）
- 用智慧幽默的方式展现名字特点
- 结合现代生活场景进行生动描述
- 保持积极正面的幽默感
- 体现名字的独特魅力

### 5. 格式规范
返回纯JSON格式：
{
  "names": [
    {
      "englishName": "名字",
      "chineseMeaning": "详细的中文寓意解释（300-500字）",
      "englishMeaning": "优雅的英文寓意描述（100-200词）", 
      "humorNote": "智慧幽默的中文说明（100-200字）"
    }
  ]
}

## 生成示例参考：

对于中文名"明轩"，可以生成：
- Ethan（音近"明"，寓意坚定可靠）
- Alexander（意近"轩"，寓意王者风范）
- Julian（气质相似，寓意智慧优雅）

请确保每个名字都有深厚的文化内涵和专业的寓意分析。`;

        const postData = JSON.stringify({
            model: "deepseek-r1-250528",
            messages: [
                {
                    role: "system",
                    content: "你是一个专业的英文名生成助手，擅长为中文名字创造有趣、有创意的英文对应名。"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.8
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 30000 // 30秒超时
        };

        console.log('正在调用DeepSeek API...');
        
        const req = https.request(API_URL, options, (res) => {
            let data = '';
            console.log(`API响应状态码: ${res.statusCode}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('API响应接收完成');
                try {
                    const response = JSON.parse(data);
                    
                    if (response.choices && response.choices[0]) {
                        const content = response.choices[0].message.content;
                        console.log('AI响应内容:', content.substring(0, 200) + '...');
                        
                        // 尝试解析JSON响应
                        try {
                            const parsedContent = JSON.parse(content);
                            if (parsedContent.names && Array.isArray(parsedContent.names)) {
                                console.log('成功解析AI响应，返回生成的名字');
                                resolve(parsedContent.names);
                            } else {
                                console.log('AI响应格式不正确，使用备用方案');
                                resolve(generateEnhancedFallbackNames(chineseName));
                            }
                        } catch (parseError) {
                            console.error('JSON解析错误:', parseError);
                            console.log('使用备用英文名生成');
                            resolve(generateEnhancedFallbackNames(chineseName));
                        }
                    } else {
                        console.log('API响应格式错误，使用备用方案');
                        resolve(generateEnhancedFallbackNames(chineseName));
                    }
                } catch (error) {
                    console.error('API响应解析错误:', error);
                    resolve(generateEnhancedFallbackNames(chineseName));
                }
            });
        });

        req.on('error', (error) => {
            console.error('API请求错误:', error.message);
            console.log('使用备用英文名生成');
            resolve(generateEnhancedFallbackNames(chineseName));
        });

        req.on('timeout', () => {
            console.log('API请求超时，使用备用方案');
            req.destroy();
            resolve(generateEnhancedFallbackNames(chineseName));
        });

        req.write(postData);
        req.end();
    });
}

// 生成增强的备用英文名（当API调用失败时使用）
function generateEnhancedFallbackNames(chineseName) {
    const enhancedMappings = {
        '张': [
            { name: 'Alexander', meaning: '守护者，保护者', description: '源自希腊语，意为"人类的守护者"，象征强大和保护' },
            { name: 'Zachary', meaning: '上帝已纪念', description: '希伯来语名字，代表神圣的纪念和祝福' },
            { name: 'Xander', meaning: '人类的保护者', description: 'Alexander的现代变体，时尚而有力' }
        ],
        '李': [
            { name: 'Leo', meaning: '狮子', description: '拉丁语名字，象征勇气和领导力' },
            { name: 'Liam', meaning: '坚定的保护者', description: 'William的爱尔兰变体，代表决心和力量' },
            { name: 'Lucas', meaning: '光明，照亮', description: '源自拉丁语，象征智慧和启迪' }
        ],
        '王': [
            { name: 'William', meaning: '坚定的保护者', description: '日耳曼语名字，代表强大的意志和保护' },
            { name: 'Wesley', meaning: '西边的草地', description: '英语名字，象征和平与自然' },
            { name: 'Winston', meaning: '欢乐的城镇', description: '英语名字，代表快乐和社区精神' }
        ],
        '刘': [
            { name: 'Louis', meaning: '著名的战士', description: '法语名字，象征荣誉和勇气' },
            { name: 'Luke', meaning: '光明', description: '希腊语名字，代表智慧和启迪' },
            { name: 'Lawrence', meaning: '月桂树', description: '拉丁语名字，象征胜利和荣誉' }
        ],
        '陈': [
            { name: 'Charles', meaning: '自由的人', description: '日耳曼语名字，代表独立和力量' },
            { name: 'Chris', meaning: '基督的追随者', description: '希腊语名字，象征信仰和奉献' },
            { name: 'Chandler', meaning: '蜡烛制造者', description: '英语名字，代表光明和希望' }
        ],
        '杨': [
            { name: 'Young', meaning: '年轻', description: '英语名字，象征活力和新生' },
            { name: 'Yale', meaning: '肥沃的高地', description: '英语名字，代表富饶和成长' },
            { name: 'York', meaning: '野猪定居地', description: '英语名字，象征勇气和坚韧' }
        ],
        '赵': [
            { name: 'Joe', meaning: '上帝将增添', description: '希伯来语名字，代表祝福和增加' },
            { name: 'John', meaning: '上帝是仁慈的', description: '希伯来语名字，象征神圣的恩典' },
            { name: 'Jason', meaning: '治愈者', description: '希腊语名字，代表健康和恢复' }
        ],
        '黄': [
            { name: 'Hugh', meaning: '心灵，智慧', description: '日耳曼语名字，象征智慧和思考' },
            { name: 'Howard', meaning: '心灵守护者', description: '英语名字，代表保护和关怀' },
            { name: 'Henry', meaning: '家庭的统治者', description: '日耳曼语名字，象征领导和家庭' }
        ],
        '周': [
            { name: 'Zhou', meaning: '周围，周全', description: '直接音译，保持文化特色' },
            { name: 'Zane', meaning: '上帝是仁慈的', description: '希伯来语名字，代表神圣恩典' },
            { name: 'Zion', meaning: '天堂，最高点', description: '希伯来语名字，象征崇高和神圣' }
        ],
        '吴': [
            { name: 'Woody', meaning: '森林的', description: '英语名字，代表自然和生机' },
            { name: 'Wade', meaning: '前进', description: '英语名字，象征进步和冒险' },
            { name: 'Warren', meaning: '保护者', description: '英语名字，代表安全和守护' }
        ]
    };

    const firstChar = chineseName.charAt(0);
    const nameData = enhancedMappings[firstChar] || [
        { name: 'Alex', meaning: '人类的保护者', description: '希腊语名字，象征强大和保护' },
        { name: 'Brian', meaning: '高贵，力量', description: '凯尔特语名字，代表尊贵和勇气' },
        { name: 'Chris', meaning: '基督的追随者', description: '希腊语名字，象征信仰和奉献' }
    ];
    
    const traits = ['智慧与洞察力', '勇气与决心', '幽默与魅力'];
    const englishTraits = ['wisdom and insight', 'courage and determination', 'humor and charm'];
    
    return nameData.map((data, index) => ({
        englishName: data.name,
        chineseMeaning: `**${data.name}** - ${data.meaning}\n\n这个名字源自${data.description}，完美体现了${chineseName}的${traits[index]}。${data.name}不仅发音优美，更蕴含着深厚的文化内涵，象征着${['保护与守护', '智慧与启迪', '欢乐与魅力'][index]}的品质。`,
        englishMeaning: `**${data.name}** - meaning "${data.meaning}"\n\nThis name originates from ${data.description.toLowerCase()} and beautifully reflects the ${englishTraits[index]} of ${chineseName}. ${data.name} not only has a pleasant pronunciation but also carries profound cultural significance, symbolizing qualities of ${['protection and guardianship', 'wisdom and enlightenment', 'joy and charm'][index]}.`,
        humorNote: `💡 **有趣的事实**：选择${data.name}作为${chineseName}的英文名，是因为${['它听起来就像一位可靠的守护者，随时准备为你挡风遮雨', '这个名字自带智慧光环，让人忍不住想向你请教人生哲理', '它的发音自带欢乐节奏，仿佛在说"生活就是要开心"'][index]}！谁说取英文名不能既专业又有趣呢？`
    }));
}

// 保留原有的简单备用函数（兼容性）
function generateFallbackNames(chineseName) {
    return generateEnhancedFallbackNames(chineseName);
}

// 对于本地开发环境，创建HTTP服务器
const server = http.createServer(async (req, res) => {
    // 处理静态文件请求 - 仅在本地环境
    if (req.method === 'GET') {
        const parsedUrl = url.parse(req.url);
        const pathname = parsedUrl.pathname;
        
        if (pathname === '/') {
            serveStaticFile(res, './index.html', 'text/html');
        } else if (pathname === '/style.css') {
            serveStaticFile(res, './style.css', 'text/css');
        } else if (pathname === '/script.js') {
            serveStaticFile(res, './script.js', 'application/javascript');
        } else {
            // 其他请求交给handleApiRequest处理
            await handleApiRequest(req, res);
        }
        return;
    }
    
    // 处理所有API请求
    await handleApiRequest(req, res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' 需要管理员权限');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' 端口已被占用');
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// 导出处理函数，以便在需要时可以作为模块使用
module.exports = handleApiRequest;