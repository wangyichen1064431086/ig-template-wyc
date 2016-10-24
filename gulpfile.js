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
const bowerResolve = require('rollup-plugin-bower-resolve');//在你的bower component目录下，通过（bower使用的针对第三方模块的解析算法）来定位模块
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
const projectName = 


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

	return gulp.src('./views/index.mustache')///此句提供mustache模板
		.pipe($.data(function(file){//a此句提供mustache模板要用到的数据
			/*gulp-data模块：从不同的来源（json,front-matter,databases,promises等）生成数据对象，并将其保存在文件对象中以供其他插件后续处理。
			*/
			return Promise.all(jsonFiles.map(helper.readJSON))
			 /* map()方法返回一个由原数组中的每个元素调用一个指定方法后的返回值组成的新数组。
			  * 该方法为helper.readJSON，详见helper.js中的function readJSON
			  * 故此处就是执行readJSON(contentDataFile)和read(footerDataFile)
			  * 执行后返回的值就是一个数组，数组项为两个对象（从文件读取JSON数据后得到的）
			*/
				.then(function(value){
					const context = value[0];
					context.footer = value[1];

					if(process.env.NODE_ENV === 'prod'){//如果是生产模式
						context.analytics = true;
						context.iconsPath = config.icons;//"http://static.ftchinese.com/ftc-icons/"
					}
					return context;
				});
		}))
		.pipe($.mustache({},{
			/* 将mustache模板渲染进入html
			*/
			extension:'.html'//指定输出文件的扩展名
		}))
		.pipe($.size({
			/*展示本项目文件的大小*/
			gzip:true,//用于决定是否展示该项目的压缩文件大小作为替代
			showFiles:true//用于决定是否展示每一个文件大小（默认是只有总文件大小）
		}))
		.pipe(gulp.dest(DEST))
		.pipe(browserSync.stream({once:true}));//文件改变了得重新启动编译过程，编译完了才能允许浏览器刷新，比如sass和js，就用通知机制stream()
});


gulp.task('style',function styles(){
	const DEST =  '.tmp/styles';

	return gulp.src('client/scss/main.scss')
		.pipe($.changed(DEST))//只处理改变了的文件
		.pipe($.plumber())//防止管道因为来自gulp插件的错误而导致的中断
		.pipe($.sourcemaps.init({
			/* 把一些方法打包，然后这些浏览器端不支持的方法就可以在浏览器端使用了。
			 * 所有在sourcemaps.init()和sourcemaps.write()之间的插件需要支持gulp-sourcemaps插件。*/
			loadMaps:true
		}))
		.pipe($.postcss([
			/*将CSS输送到好几个处理器，但只解析一次CSS。
			*/
			cssnext({
			/*PostCSS插件，帮助你使用最新的CSS语法。它会将CSS转换成兼容性更好的CSS，这样你就不需要等待浏览器的支持了
			*/
				features:{
					/* 该对象features 包含一些特征的关键字，来设置其的可用/禁用。特征默认都是可用的
					*/
					colorRgba:false
				}
			})
		]))
		.pipe($.if(process.env.NODE_ENV === 'prod',$.cssnano()))
		.pipe($.size({
			gzip:true,
			showFiles:true
		}))
		.pipe($.sourcemaps.write('./'))
		.pipe(gulp.dest(DEST))
		.pipe(browserSync.stream({once:true}));
});

///任务eslint:就是对client/js下的js文件检查语法错误的
gulp.task('eslint',() => {
	return gulp.src('client/js/*.js')
		.pipe($.eslint())//一个基于AST的针对JavaScript的模式检查器,要用到根目录下的.eslintrc.js。
		.pipe($.eslint.format())//一次性格式化所有流中的文件
		.pipe($.eslint.failAfterError());//如果ESLint为任何一个文件报错了，就等到它们处理完了再终止任务流。
});

gulp.task('webpack',function(done){//webpack模块待细学！！！
	/*以webpack.config.js为参数配置文件,以作为模块导入为webpackConfig对象*/
	if(process.env.NODE_ENV === 'prod') {
		delete webpackConfig.watch;//watch: true
		webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin());
		/* webpackConfig.plugins: [new BowerWebpackPlugin({includes: /\.js$/
		})]
		 * webpack.optimize.UglifyJSPlugin():来自webpack模块，用于压缩你通过webpack打包后的scripts文件
		*/
	}
	webpack(webpackConfig,function(err,stats){
		if(err){
			throw new $.util.PluginError('webpack',err);
		}
		$.util.log('[webpack]',stats.toString({
			colors:$.util.colors.supportsColor,
			chunks:false,
			hash:false,
			version:false
		}))
		browserSync.reload({once: true});
		done();
	});
});

gulp.task('serve',gulp.paraller('mustache','styles','webpack',function serve(){
	browserSync.init({
		server:{
			baseDir:['.tmp','custom','public'],
			routes:{
				'/bower_components':'bower_components'
			}
		},
		files:'custom/**/*.{css,js,csv}'
	});

	gulp.watch(['views/**/*/*.mustache','data/*.json'],gulp.parallel('mustache'));
	gulp.watch('client/scss/**/**/*.scss',gulp.parallel('styles'));
}));

/***build***/
///任务rollup:将client/js/main.js编译、压缩，将结果保存到.tmp/script/main.js
//use rollup and buble to build js
gulp.task('rollup',() => {
	return rollup({//新一代ES6的模块打包机
		entry:'client/js/main.js',
		plugins:[
			bowerResolve(),//在你的bower component目录下，通过（bower使用的针对第三方模块的解析算法）来定位模块
			buble(),//速度极快的、电池类的ES2015编译器(疑问：是要将ES6编译为ES5吗？)
			uglify()////卷曲相关插件以压缩最后生成的包
		],
		cache:cache//前面定义了var cache,故此处catch为null。
	}).then(function(bundle){
		cache = bundle;

		return bundle.write({
			format:'life',
			/* 指明产生的项目包的格式。
			 * 可以为amd/cjs/es/life/umdA 
			 * life格式的意思为：self-executing function, suitable for inclusion as a <script> tag
			*/
			dest:'.tmp/scripts/main.js',//要写入的目标文件。
			sourceMap:true//指明是否产生一个sourcemap。
		});
	});
});

///任务custom:将custom/目录下的projectName.js/projectName.css拷贝到.tmp/目录下
gulp.task('custom',()=>{
	const SRC = 'custom/**/' + projectName +'.{js,css}';
	const DEST = '.tmp';
	console.log('Copy custom js and css files to:',DEST);
	return gulp.src(SRC)
		.pipe(gulp.dest(DEST));
});


///任务prefix：为.tmp/index.html中的$('picture source')元素的srcset属性值（是一个由逗号分隔的字符串）分别添加前缀
gulp.task('prefix',() => {
	return gulp.src('.tmp/index.html')
		.pipe($.cheerio(function($,file){
			/*
			 * cheerio:为服务器特别定制的小型、快速、优雅的jQuery核心实现。
			 * gulp-cheerio是gulp的cheerio
			 * 此处用的是gulp-cheerio的同步方法
			*/
			$('picture source').each(function(){//为每一个$('picture source')执行如下函数
				var source = $(this);
				var srcset = source.attr('srcset');//获取$('picture source')的属性'srcset'
				if (srcset) {
					srcset = srcset.split(',').map(
						/* split:把一个String分割成一个字符串数组。
						 * map(callback):返回一个由原数组中的每个元素调用一个指定方法后的返回值组成的新数组。
						 ** map的callback的参数：
						 ** - currentValue(第一个参数：数组中当前被传递的元素)
						 ** - index(第二个参数：数组中当前被传递的元素的索引)
						 ** - array(第三个参数：调用map方法的数组)
						*/
						function(href){//此处形参href即为数组中当前被传递的元素
						return url.resolve(config.imgPrefix,href).replace('%20',' ');
						/*config.imgPrefix:"http://interactive.ftchinese.com/"
						 *该句话就是将（"http://interactive.ftchinese.com/"） 和 （$('picture source')的属性srcset的值中逗号分隔的每个值）分别拼接起来，并将拼接结果中的'%20'替换为' '
						 */
					}).join(', ');//然后再将加上了"http://interactive.ftchinese.com/"前缀的数组join成逗号分隔的字符串
					source.attr('srcset',srcset);//用新的srcset为$('picture source')的属性'srcset'赋值。
				}
			});
		}))
		.pipe(gulp.dest('dist'));
});