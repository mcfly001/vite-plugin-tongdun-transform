/*
 * @Description: 同盾react vite自定义配置，解决循环依赖/动态添加React & index.html
 * @Author: 郑泳健
 * @Date: 2022-08-08 10:04:24
 * @LastEditors: 郑泳健
 * @LastEditTime: 2022-08-08 13:37:51
 */
import fs from 'fs';
import path from 'path'
import history from 'connect-history-api-fallback';

export function tdViteTransformReact({ htmlPath = './src/index.html', entriesPath = './src/app.js' }) {
    return [
        {
            name: 'vite-plugin-tongdun-react-transfrom',
            enforce: 'pre',
            config() {
                return {
                    build: {
                        rollupOptions: {
                            input: {
                                index: path.resolve(__dirname, htmlPath)
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
                    const htmlStr = fs.readFileSync(path.resolve(process.cwd(), htmlPath), 'utf-8')

                    return htmlStr + `<script type="module" src="${entriesPath}"></script>`
                }
            },
            transform(code, src, opt) {
                // fix 循环依赖的问题
                if (['.js', '.ts', '.jsx', '.tsx'].includes(path.extname(src))) {
                    // 入口导出getAppStore
                    if (src.includes(path.resolve(process.cwd(), './src/app'))) {
                        code += '\n window.__app__ = app'
                    } else {
                        // 如果有getAppStore的文件就要做特殊处理
                        if (code.includes('getAppStore')) {
                            const list = code.split('\n').map(i => {
                                if (i.includes('import') && i.includes('getAppStore')) {
                                    return 'const getAppStore = window.__app__'
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