import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 8080

// 中间件
app.use(cors())
app.use(express.json())

// Mock 数据
const mockData = {
    // 控制台统计
    stats: {
        totalUsers: 1250,
        totalProviders: 85,
        totalOrders: 320,
        totalRevenue: 25600,
        pendingProviders: 3,
        pendingOrders: 12,
    },

    // 图表数据
    charts: [
        { date: '2024-01-01', orders: 45, revenue: 3600 },
        { date: '2024-01-02', orders: 52, revenue: 4160 },
        { date: '2024-01-03', orders: 38, revenue: 3040 },
        { date: '2024-01-04', orders: 61, revenue: 4880 },
        { date: '2024-01-05', orders: 49, revenue: 3920 },
    ],

    // 服务者列表
    providers: [{
            id: '1',
            name: '张三',
            phone: '13800138001',
            status: 'pending',
            rating: 4.5,
            serviceCount: 25,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
        },
        {
            id: '2',
            name: '李四',
            phone: '13800138002',
            status: 'verified',
            rating: 4.8,
            serviceCount: 45,
            createdAt: '2024-01-10T14:20:00Z',
            updatedAt: '2024-01-10T14:20:00Z',
        },
    ],

    // 订单列表
    orders: [{
        id: '1',
        orderNo: 'ORD20240115001',
        userId: 'u1',
        userName: '用户A',
        serviceId: 's1',
        serviceName: '家政清洁',
        status: 'pending',
        amount: 150,
        address: '北京市朝阳区某某街道',
        scheduledTime: '2024-01-16T10:00:00Z',
        createdAt: '2024-01-15T14:30:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
    }, ],
}

// API 路由
app.get('/admin/v1/dashboard/stats', (req, res) => {
    res.json({ code: 200, data: mockData.stats, message: 'success' })
})

app.get('/admin/v1/dashboard/charts', (req, res) => {
    res.json({ code: 200, data: mockData.charts, message: 'success' })
})

app.get('/admin/v1/providers', (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query
    let items = mockData.providers

    if (status) {
        items = items.filter(p => p.status === status)
    }

    const total = items.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedItems = items.slice(startIndex, endIndex)

    res.json({
        code: 200,
        data: {
            items: paginatedItems,
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        },
        message: 'success'
    })
})

app.get('/admin/v1/orders', (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query
    let items = mockData.orders

    if (status) {
        items = items.filter(o => o.status === status)
    }

    const total = items.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedItems = items.slice(startIndex, endIndex)

    res.json({
        code: 200,
        data: {
            items: paginatedItems,
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
        },
        message: 'success'
    })
})

// 登录接口
app.post('/admin/v1/auth/login', (req, res) => {
    const { username, password } = req.body

    if (username === 'admin' && password === '123456') {
        res.json({
            code: 200,
            data: {
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: '1',
                    username: 'admin',
                    nickname: '管理员',
                    role: 'admin',
                    permissions: ['*'],
                    menus: [{
                            id: 'provider',
                            name: '服务者管理',
                            path: '/provider',
                            icon: 'Avatar',
                            children: [{
                                id: 'provider-list',
                                name: '服务者列表',
                                path: '/provider/list',
                            }, ],
                        },
                        {
                            id: 'order',
                            name: '订单管理',
                            path: '/order',
                            icon: 'Document',
                            children: [{
                                id: 'order-list',
                                name: '订单列表',
                                path: '/order/list',
                            }, ],
                        },
                    ],
                },
            },
            message: 'success',
        })
    } else {
        res.status(401).json({
            code: 401,
            message: '用户名或密码错误',
        })
    }
})

// 刷新用户信息接口
app.post('/admin/v1/auth/refresh', (req, res) => {
    // 模拟从token中获取用户信息
    res.json({
        code: 200,
        data: {
            id: '1',
            username: 'admin',
            nickname: '管理员',
            role: 'admin',
            permissions: ['*'],
            menus: [{
                    id: 'provider',
                    name: '服务者管理',
                    path: '/provider',
                    icon: 'Avatar',
                    children: [{
                        id: 'provider-list',
                        name: '服务者列表',
                        path: '/provider/list',
                    }, ],
                },
                {
                    id: 'order',
                    name: '订单管理',
                    path: '/order',
                    icon: 'Document',
                    children: [{
                        id: 'order-list',
                        name: '订单列表',
                        path: '/order/list',
                    }, ],
                },
            ],
        },
        message: 'success',
    })
})

// 其他接口返回404
app.use('/admin/v1/*', (req, res) => {
    res.status(404).json({
        code: 404,
        message: 'API接口未实现',
    })
})

// 启动服务器
app.listen(PORT, () => {
    console.log(`Mock API server is running on http://localhost:${PORT}`)
    console.log(`Admin API endpoints available at http://localhost:${PORT}/admin/v1/*`)
})