const fs = require('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');
const co = require('co');
const mkdirp = require('mkdirp');
const nunjucks = require('nunjucks');
const helper = require('./helper');

const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const del = require('del');
const cssnext = require('postcss-cssnext');
const $ = require('gulp-load-plugins')();
const minimist = require('minimist');//解析命令行参数

const rollup = require('rollup').rollup;//新一代ES6模块打包机
const buble = require('rollup-plugin-buble');//buble模块——速度极快的、电池类的ES2015编译器；rollup-plugin-buble——使用buble编译ES2015
const bowerResolve = require('rollup-plugin-bower-resolve');//在你的bower component目录下，通过bower使用的针对第三方模块的解析算法来定位模块
const uglify = require('rollup-plugin-uglify');//卷曲相关插件以压缩最后生成的包
const webpack = require('webpack');//为浏览器打包CommonJs/AMD模块
const webpackConfig = require('./webpack.config.js');


var cache;

process.env.NODE_ENV = 'dev';

const config = require('./config.json');
/**{
		"html":"../special/",
		"assets":"../ft-interact/",
		"test":"../interact/",
		"imgPrefix":"http://interactive.ftchinese.com/",
		"icons":"http://static.ftchinese.com/ftc-icons/"
  	}
*/

nunjucks.configure('demos',{
	/** nunjucks.configure([path],[opts]):将给定的字符串编译成可重复使用的nunjucks模板对象
	  * 参数path:（可选）指定存放模板的目录,默认值为当前的工作目录
	  * 参数opts：（可选）可让某些功能开启或关闭

	*/
	autoescape:false,//控制输出是否被转义
	noCache:true//不使用缓存，每次都重新编译
});


const knownOptions = {
	string: 'input',
	default: {input:'myanmar'},
	alias:{i:'input'}
};
const argv = minimist(process.argv.slice(2),knownOptions);
/** minimist:解析命令行参数
  * eg:假设当前你执行的命令行是：gulp serve -i myanmar.json
  * 相关值结果为：
  ** process.argv: (type为Array)
	[C:\Program Files\nodejs\node.exe,C:\Program Files\nodejs\node_modules\gulp\bin\gulp.js,serve,-i,myanmar.json]
  ** process.argv.slice(2): (type为Array)
	[serve,-i,myanmar.json]
  ** argv:(type为object)
	{_:['serve'],i:'myanmar.json',input:'myanmar.json'}
  ** argv.i:(type为String)
	myanmar.json
*/
const contentDataFile = path.resolve(__dirname,'data',argv.i+'.json');//设置内容数据文件路径：__dirname/data/myanmar.json
const footerDataFile = path.resolve(__dirname,'data','footer.json');//设置脚部数据文件路径：__dirname/data/footer.json



gulp.task('prod',function(done){
	process.env.NODE_ENV = 'prod';
	done();//疑问：这个done是干嘛用的？？？
});

gulp.task('dev',function(done){
	process.env.NODE_ENV = 'dev';
	done();
});

gulp.task('mustache',function(){
	const DEST = '.tmp';

	const jsonFiles = [contentDataFile,footerDataFile];

	return gulp.src('./views/index.mustache')
		.pipe($.data(function(file){//gulp-data模块：从不同的来源（json,front-matter,databases,promises等）生成数据对象，并将其保存在文件对象中以供其他插件后续处理。
			return Promise.all(jsonFiles.map(helper.readJSON))//helper.js待写---明天从这一行开始研究
				.then(function(value){
					const context = value[0];
					context.footer = value[1];

					if(process.env.NODE_ENV === 'prod'){
						context.analytics = true;
						context.iconsPath = config.icons;//"http://static.ftchinese.com/ftc-icons/"
					}
					return context;
				});
		}))
		.pipe($.mustache({},{
			extension:'.html'
		}))
		.pipe($.size({
			gzip:true,
			showFiles:true
		}))
		.pipe(gulp.dest(DEST))
		.pipe(browserSync.stream({once:true}));
		
});


