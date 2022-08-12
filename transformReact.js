/*
 * @Description: 同盾react vite自定义配置，解决循环依赖/动态添加React & index.html
 * @Author: 郑泳健
 * @Date: 2022-08-08 10:04:24
 * @LastEditors: 郑泳健
 * @LastEditTime: 2022-08-12 10:59:15
 */
const path = require('path');
const history = require('connect-history-api-fallback');

module.exports = function tdViteTransformReact({ htmlPath = './src/index.html', entriesPath = '/src/app.js' }) {
    return [
        {
            name: 'vite-plugin-tongdun-react-transfrom',
            enforce: 'pre',
            config(viteConfig) {
                return {
                    build: {
                        rollupOptions: {
                            input: {
                                index: path.resolve(viteConfig.root, htmlPath)
                            }
                        }
                    }
                }
            },
            configureServer(server) {
                server.middlewares.use(history({
                    htmlAcceptHeaders: ["text/html", "application/xhtml+xml"],
                    rewrites: [{
                        from: /^\/*/,
                        to: () => {
                            return htmlPath
                        }
                    }]
                }))
            },
            transformIndexHtml: {
                transform(html) {
                    return html + `<script type="module" src="${entriesPath}"></script>`
                }
            },
            transform(code, src, opt) {
                // fix 循环依赖的问题
                if (['.js', '.ts', '.jsx', '.tsx'].includes(path.extname(src))) {
                    // 入口导出getAppStore
                    if (src.includes('src/app')) {
                        code += '\n window.__app__ = app'
                    } else {
                        // 如果有getAppStore的文件就要做特殊处理
                        if (code.includes('getAppStore')) {
                            const list = code.split('\n').map(i => {
                                if (i.includes('import') && i.includes('getAppStore')) {
                                    return 'const getAppStore = () => window.__app__._store'
                                }
                                return i;
                            })

                            return list.join('\n')
                        }
                    }
                }

                // 动态插入React,这样vite可以热更新，要不然会整个页面刷新
                if (['.js', '.ts'].includes(path.extname(src)) && code.includes('react') && !code.includes('React')) {
                    code = `import React from 'react'\n` + code
                }

                return code
            }
        }
    ]
}