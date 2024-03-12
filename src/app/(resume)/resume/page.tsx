import ResumeFile from './resume.md';
import ReactMarkdown from 'react-markdown';

export default async function Resume() {
  return (
    <>
      <article className="prose prose-sm mx-auto max-w-2xl px-5 pb-32 pt-16 font-sans">
        <ReactMarkdown>{ResumeFile}</ReactMarkdown>
      </article>

      {/*<div className="typora-export-content">*/}
      {/*  <div id="write"><h1 id="赵越的简历"><span>赵越的简历</span></h1><h2 id="个人信息"><span>个人信息</span>*/}
      {/*  </h2>*/}
      {/*    <ul>*/}
      {/*      <li><p><strong><span>我</span></strong><span>: 赵越 | 1996 年 | 男 | Base 北京</span></p></li>*/}
      {/*      <li><p><strong><span>教育水平</span></strong><span>: 本科 | 河南师范大学 | 计算机科学与技术专业</span></p>*/}
      {/*      </li>*/}
      {/*      <li><p><strong><span>手机 &amp; 微信</span></strong><span>: +86 155 6525 2838</span></p></li>*/}
      {/*      <li><p><strong><span>Email</span></strong><span>: </span><a*/}
      {/*        href="/cdn-cgi/l/email-protection#b0c6d1c2cac9ddd5f0d7ddd1d9dc9ed3dfdd" target="_blank"*/}
      {/*        className="url"><span*/}
      {/*        className="__cf_email__"*/}
      {/*        data-cfemail="c7b1a6b5bdbeaaa287a0aaa6aeabe9a4a8aa">[email&#160;protected]</span></a>*/}
      {/*      </p></li>*/}
      {/*      <li><p><strong><span>Github</span></strong><span>: </span><a href="https://github.com/varzy" target="_blank"*/}
      {/*                                                                   className="url">https://github.com/varzy</a></p>*/}
      {/*      </li>*/}
      {/*    </ul>*/}
      {/*    <p><span>如果你想更深入得了解我，不妨看看我的</span><a*/}
      {/*      href="https://varzy.me/"><span>个人主页</span></a><span>。</span></p><h2 id="技能清单"><span>技能清单</span>*/}
      {/*    </h2>*/}
      {/*    <h4 id="前端"><span>前端</span></h4>*/}
      {/*    <ul>*/}
      {/*      <li><p><span>熟练使用 HTML + CSS；熟悉 JavaScript 基本特性，熟练使用 ES6+ 语法；熟练使用 TypeScript</span></p>*/}
      {/*      </li>*/}
      {/*      <li><p><span>熟练使用 MVVM 框架，擅长 Vue 及相关生态；能够使用 React, JSX 等技术</span></p></li>*/}
      {/*      <li><p><span>熟悉 Node.js 及相关生态，能够开发 API、中间件及 SSR 等</span></p></li>*/}
      {/*      <li><p><span>熟悉微信小程序开发，有使用原生技术栈开发大型项目的经验</span></p></li>*/}
      {/*      <li><p><span>熟悉 Vite, Webpack, Gulp 等主流工程化工具；熟练使用 Sass 等 CSS 预处理器组织样式</span></p></li>*/}
      {/*      <li><p><span>熟练使用主流工具库，如 jQuery, ElementUI, ECharts, Axios 等</span></p></li>*/}
      {/*    </ul>*/}
      {/*    <h4 id="后端--devops"><span>后端 &amp; DevOps</span></h4>*/}
      {/*    <ul>*/}
      {/*      <li><p><span>对 PHP, Java 等后端语言和框架均有涉猎，擅长使用 Nest.js 和 Laravel 框架</span></p></li>*/}
      {/*      <li><p><span>对 MySQL, Redis, MongoDB 等主流数据库有一定了解</span></p></li>*/}
      {/*      <li><p><span>熟练使用 Linux 系统，及 Nginx, Docker 等工具，能够完成从开发到部署的整套流程</span></p></li>*/}
      {/*    </ul>*/}
      {/*    <h4 id="团队协作"><span>团队协作</span></h4>*/}
      {/*    <ul>*/}
      {/*      <li><p><span>熟练使用 Git，能够践行 Git Flow 工作流</span></p></li>*/}
      {/*      <li><p><span>熟练使用 ESlint, Stylelint, Prettier, TypeScript 等工具，乐意遵守代码规范</span></p></li>*/}
      {/*    </ul>*/}
      {/*    <h2 id="工作经历"><span>工作经历</span></h2><h4 id="202006---至今-北京搜狐新媒体信息技术有限公司"><span>2020.06 - 至今 北京搜狐新媒体信息技术有限公司</span>*/}
      {/*    </h4><p>*/}
      {/*      <span>任职于汽车产品中心，担任前端开发工程师，主要负责网页、微信小程序、管理后台等项目的开发和维护工作。</span>*/}
      {/*    </p>*/}
      {/*    <blockquote><p><span>(项目列表 TODO...)</span></p></blockquote>*/}
      {/*    <h4 id="201903---202004-紫光云技术有限公司"><span>2019.03 - 2020.04 紫光云技术有限公司</span></h4><p><span>担任数据中台团队(天津)的前端负责人，负责架构设计、代码评审、成员工作安排等工作。在职期间主要使用 Vue 构建 PC 端项目，以及使用 Nuxt 搭建门户网站。</span>*/}
      {/*    </p><p>*/}
      {/*      <strong><span>数据管理 DMS</span></strong><span> </span><code>Vue</code><span> </span><code>PC</code><span> </span><code>Database</code>*/}
      {/*    </p>*/}
      {/*    <blockquote><p><span>一款 Web 端的数据库管理软件，使用 Vue CLI + ElementUI 搭建，支持 MySQL, MongoDB, Redis, Hive 等主流数据库的在线管理，有效代码超过 6W 行。</span>*/}
      {/*    </p><p><span>重难点在于需要在单一项目中支持多种风格的数据库，在保证风格统一和高性能的前提下实现多种数据库的功能隔离。入职后我针对布局、菜单、路由、权限、可复用组件等模块进行了渐进式优化，大幅提高了代码复用率和可扩展性，代码量减少约 40%。</span>*/}
      {/*    </p><p><span>除此之外，项目结合 Vuex 和 KeepAlive 实现了多标签页功能；引入并定制了 Monaco Editor 实现了 SQL 语句的自动补全；结合 Vuex 和路由守卫实现了基于路由自动维护的菜单栏；封装了公共验证类以简化巨量的表单验证需求...</span>*/}
      {/*    </p></blockquote>*/}
      {/*    <p>*/}
      {/*      <strong><span>模型设计器</span></strong><span> </span><code>Vue</code><span> </span><code>PC</code><span> </span><code>BI</code>*/}
      {/*    </p>*/}
      {/*    <blockquote><p>*/}
      {/*      <span>一款 Web 端的类 BI 工具，可使用鼠标拖拽生成关系型数据库映射模型，不写 SQL 也能对数据进行查询和统计。</span>*/}
      {/*    </p><p><span>项目结合 HTML 原生拖拽 API 和深度定制的 ElTree 组件实现了一个支持无限级懒加载和动态更新的数据模型树，支持拖拽排序、拖入插入、拖出删除等功能。项目的数据结构相对复杂，有大量同一数据在多个组件间交叉通信的场景(尤其面对拖拽操作时)，因此项目额外引入了 Model 层，将模型、分组、树节点等数据结构封装为独立的 Model 类，保证跨组件通信时数据结构稳定。</span>*/}
      {/*    </p></blockquote>*/}
      {/*    <p>*/}
      {/*      <strong><span>日志服务平台</span></strong><span> </span><code>Vue</code><span> </span><code>PC</code><span> </span><code>Kibana</code><span> </span><code>ELK</code>*/}
      {/*    </p>*/}
      {/*    <blockquote><p><span>一款能对软件产生的日志进行抓取、检索和分析的在线工具，主项目使用 Vue 开发，并内嵌了一个经过定制的 Kibana 组件。</span>*/}
      {/*    </p><p><span>最大的难点在于 Kibana 的定制，由于资料甚少，在前期调研和阅读源码上花费了很多精力，最终在 Linux 系统下完成了 Kibana 开源版的定制开发和编译，并且编写了项目的整体 Nginx 配置，保证各个组件能够正常通信。</span>*/}
      {/*    </p></blockquote>*/}
      {/*    <h4 id="201805---201903-北京古点科技有限公司"><span>2018.05 - 2019.03 北京古点科技有限公司</span></h4><p><span>在职期间主要涉及微信小程序和管理后台项目的开发，除此之外还加强了后端技能，学习 PHP + Laravel 并独立开发接口和网站。</span>*/}
      {/*    </p><p>*/}
      {/*      <strong><span>dotcom space 微信小程序</span></strong><span> </span><code>微信小程序</code><span> </span><code>mpvue</code><span> </span><code>商城</code>*/}
      {/*    </p>*/}
      {/*    <blockquote><p><span>一个使用 mpvue + Vuex 开发的商城类微信小程序。</span></p><p><span>项目迭代过程中我进行了多次专项优化。首先解决了购物车模块的性能问题，优化后可瞬间响应增减商品操作；小程序逐步加入了会员、特价、优惠券、积分等功能，导致价格计算逻辑愈发复杂，后续通过在 Vuex 各模块中编写运算策略实现了全自动的即时计算，大幅简化逻辑，提升性能和可维护性；多次优化下单模块，对十余种异常情况进行针对性处理。</span>*/}
      {/*    </p></blockquote>*/}
      {/*    <p>*/}
      {/*      <strong><span>Nissei 贩售机管理后台及接口</span></strong><span> </span><code>Vue</code><span> </span><code>TS</code><span> </span><code>PHP</code><span> </span><code>Laravel</code><span> </span><code>Restful*/}
      {/*      API</code></p>*/}
      {/*    <blockquote><p><span>一个在线管理全国日世冰淇淋贩售机的项目。</span></p><p><span>项目需求涉及物联网通信，对稳定性要求较高，因此在立项之初我推动管理后台引入了 TypeScript，这也大幅提升了开发过程中前端团队的协作效率。除此之外，项目还实现了 RBAC 角色管理、自动维护菜单栏等功能。</span>*/}
      {/*    </p><p><span>项目期间我主动学习了 PHP 和 Laravel 框架，并承担接口开发等工作。除图表统计和支付等复杂接口外，我完成了数据表设计，RBAC 权限中间件，以及其余 40+ 接口的开发工作。</span>*/}
      {/*    </p></blockquote>*/}
      {/*    <h4 id="201708---201805-北京精准沟通传媒科技股份有限公司">*/}
      {/*      <span>2017.08 - 2018.05 北京精准沟通传媒科技股份有限公司</span></h4><p><span>主要使用 Vue 相关生态构建 PC 端、H5 和大屏项目，对接过企业微信和海康威视的视频监控系统。</span>*/}
      {/*    </p><p>*/}
      {/*      <strong><span>红旗汽车 DMP 系统</span></strong><span> </span><code>PC</code><span> </span><code>H5</code><span> </span><code>大屏</code><span> </span><code>ECharts</code>*/}
      {/*    </p>*/}
      {/*    <blockquote><p><span>项目可分为 PC, H5 和大屏三部分，均基于 Vue CLI 2 进行开发。我部分负责了 PC 端的开发，全量负责了 H5 和大屏端的开发。</span>*/}
      {/*    </p><p><span>三端均涉及大量的 ECharts 图表，因此封装了一个能使用链式操作快速生成 Echarts 配置的工具。大屏端还对接了海康威视的视频监控系统，通过 Video.js 实现了 m3u8 视频流的直播播放，并适配 IE9 浏览器。</span>*/}
      {/*    </p></blockquote>*/}
      {/*    <h2 id="自我评价"><span>自我评价</span></h2><p><span>A Curious Geek. 正版主义者，开源主义者，乐于接受新知识和新技术。喜欢折腾各种软硬件，善于使用能提升幸福感的生产力工具。</span>*/}
      {/*    </p><p>*/}
      {/*      <span>A Romantic Virgo. 喜欢整洁的桌面，优雅的代码和一目了然的注释，要求自己一定要写出当前能力下质量最高的代码。</span>*/}
      {/*    </p><p><span>A True Programmer. 热爱编程，善于思考，喜欢解决问题后的成就感。懂得抬头看天空，更懂得低头敲键盘。</span>*/}
      {/*    </p><p>*/}
      {/*      <span>A Nice Guy. 微社恐但易相处，面对女生也许会羞涩。守时，拒绝拖拉。纵然有着身为程序员的小骄傲，但时刻牢记自己仅仅是一个站在巨人肩膀上默默攀爬的后辈。</span>*/}
      {/*    </p></div>*/}
      {/*</div>*/}
      {/*<a className="pin pdf_downloader" href="./files/resume.pdf" download="赵越-前端-15565252838.pdf">PDF</a><a*/}
      {/*className="pin md_downloader" href="./files/resume.md" download="赵越-前端-15565252838.md">MD</a>*/}
      {/*<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>*/}
    </>
  );
}
