## 安装

``` javascript
npm i vite-plugin-tongdun-transform --save-dev
```

## 配置

``` javascript
// react 项目
import { tdViteTransformReact } from 'vite-plugin-tongdun-transform';
export default defineConfig({
    plugins: [
        tdViteTransformReact({
            htmlPath: './src/index.html', // html的地址
            entriesPath: '/src/app.js' // 入口js文件
        })
    ]
})
```

