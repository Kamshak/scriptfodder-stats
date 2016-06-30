"use strict";function appendTransform(defaults,transform){return defaults=angular.isArray(defaults)?defaults:[defaults],defaults.concat(transform)}var app=angular.module("stats",["ngAnimate","ngCookies","ngTouch","ngResource","ngSanitize","ui.router","ui.bootstrap","ngStorage","darthwade.loading","mwl.bluebird","daterangepicker","nvd3","angularMoment","ksCurrencyConvert"]).config(["$httpProvider",function($httpProvider){$httpProvider.interceptors.push(["LoadingIndicator","$q",function(LoadingIndicator,$q){return{request:function(config){return LoadingIndicator.startedLoading(),config},requestError:function(rejection){return LoadingIndicator.finishedLoading(),$q.reject(rejection)},responseError:function(rejection){return LoadingIndicator.finishedLoading(),$q.reject(rejection)},response:function(response){return LoadingIndicator.finishedLoading(),response}}}])}]).run(["$transitions","$state","ScriptFodder",function($transitions,$state,ScriptFodder){$transitions.onBefore({to:"statistics.*"},["$transition$",function($transition$){if(console.log($transition$),!ScriptFodder.loaded)return"loading"!=$transition$.from().name&&$state.target("loading")}]);var matchCriteria={to:function(state){return null!=state.redirectTo}},redirectFn=function($transition$){return $state.target($transition$.to().redirectTo)};$transitions.onBefore(matchCriteria,redirectFn)}]).run(["$trace",function($trace){$trace.enable(1)}]).config(["$stateProvider","$urlRouterProvider",function($stateProvider,$urlRouterProvider){$stateProvider.state("home",{url:"/",templateUrl:"app/main/main.html",controller:"MainCtrl"}).state("statistics",{url:"/stats",templateUrl:"app/statistics/statistics.html",controller:"StatisticsCtrl",redirectTo:"statistics.dashboard","abstract":!0,resolve:{scripts:["ScriptFodder",function(ScriptFodder){return ScriptFodder.getScriptInfo()}]}}).state("loading",{url:"/loading",templateUrl:"app/statistics/loading.html",controller:"LoadingCtrl",resolve:{returnTo:["$transition$",function($transition$){var redirectedFrom=$transition$.previous();if(null!=redirectedFrom){for(;redirectedFrom.previous();)redirectedFrom=redirectedFrom.previous();return{state:redirectedFrom.to(),params:redirectedFrom.params("to")}}var fromState=$transition$.from(),fromParams=$transition$.params("from");return""!==fromState.name?{state:fromState,params:fromParams}:{state:"home"}}]}}).state("statistics.dashboard",{url:"",templateUrl:"app/statistics/dashboard.html",controller:"DashboardCtrl"}).state("statistics.related",{url:"/related",templateUrl:"app/statistics/purchaseinfo.html",controller:"PurchaseInfoCtrl"}).state("statistics.revenue",{url:"/revenue",templateUrl:"app/statistics/revenue.html",controller:"RevenueCtrl"}).state("statistics.alltime",{url:"/alltime",templateUrl:"app/statistics/alltime.html",controller:"AlltimeCtrl"}).state("statistics.monthly",{url:"/monthly",templateUrl:"app/statistics/monthly.html",controller:"MonthlyCtrl"}).state("about",{url:"/about",templateUrl:"app/about/about.html"}),$urlRouterProvider.otherwise("/")}]).run(["$q",function($q){$q.longStackTraces()}]).run(["$localStorage",function($localStorage){$localStorage.globalCurrency=$localStorage.globalCurrency||"USD"}]);angular.module("stats").controller("NavbarCtrl",["$scope","ScriptFodder","LoadingIndicator","$rootScope",function($scope,ScriptFodder,LoadingIndicator,$rootScope){$scope.ScriptFodder=ScriptFodder,$scope.loadingIndicator=LoadingIndicator}]),angular.module("stats").controller("StatisticsCtrl",["$scope","$localStorage",function($scope,$localStorage){$scope.$storage=$localStorage}]),angular.module("stats").controller("RevenueCtrl",["$scope","$loading","ScriptFodder","$q","scripts",function($scope,$loading,ScriptFodder,$q,scripts){function generateData(scripts,dataType){for(var data=[],labels=[],i=0;i<scripts.length;i++){var purchases=scripts[i].purchases;data[i]=_.chain(purchases).filter(function(purchase){return moment(1e3*purchase.purchase_time).isBetween($scope.dateRange.startDate,$scope.dateRange.endDate)}).groupBy(function(purchase){var date=new Date(1e3*purchase.purchase_time);return date.setSeconds(0),date.setMinutes(0),date.setHours(12),date.valueOf()}).reduce(function(result,purchases,key){if("revenue"==dataType){var total=_.chain(purchases).pluck("price").reduce(_.add).value();result[key]=total}else"purchases"==dataType&&(result[key]=purchases.length);return result},{}).tap(function(grouped){for(var start=moment(1*_(grouped).keys().min()),end=moment(1*_(grouped).keys().max()),current=start,i=0;current.add(1,"d"),grouped[1e3*current.unix()]=grouped[1e3*current.unix()]||0,current.isBefore(end);i++);console.log("Finished")}).map(function(purchases,key,object){var date=new Date(1*key);return{date:date,value:purchases}}).sortBy(function(pair){return pair.date}).value(),labels[i]=scripts[i].name}return{data:data,labels:labels}}$loading.start("data"),$scope.dateRange={},$scope.checkModel={0:!0},$scope.scripts=scripts;var earliest=_.chain($scope.scripts).pluck("addedDate").min().value();$scope.dateRange={startDate:new Date(1e3*earliest),endDate:Date.now()},$scope.maxDate=Date.now(),$scope.$watch(function(){return[$scope.checkModel,$scope.dateRange]},function(newValue,oldValue){var scripts=_.filter($scope.scripts,function(value,index){return $scope.checkModel[index]});if(!(scripts.length<1)){var data=generateData(scripts,"purchases");MG.data_graphic({title:"Number of Purchases",data:data.data,legend:data.labels,legend_target:".legend",target:"#number",full_width:!0,interpolate:"basic",height:200,right:40,linked:!0,y_label:"Amount"});for(var data2=generateData(scripts,"revenue"),merged=[],i=0;i<data2.data.length;i++){var indexed=_(data2.data[i]).indexBy("date").value();_.merge(merged,indexed,merged,function(a,b){return a&&b?{date:a.date,value:a.value+b.value}:a&&!b?a:!a&&b?b:void 0})}var revenueData=_(merged).values().sortBy(function(pair){return pair.date}).value();MG.data_graphic({title:"Revenue",data:revenueData,yax_units:"$",target:"#revenue",full_width:!0,interpolate:"basic",y_label:"Revenue in $",height:200,right:40,linked:!0})}},!0)}]),angular.module("stats").controller("MonthlyCtrl",["$scope","scripts",function($scope,scripts){function getIntervalStats(interval){var intervalStats=_(scripts).mapValues(function(script){var scriptData=_(script.purchases).filter(function(purchase){return purchase.price>0}).groupBy(function(purchase){return moment(1e3*purchase.purchase_time).startOf(interval).unix()}).tap(function(array){for(var current=moment(earliest);!current.isAfter(latest);current.add(1,"M"))array[current.unix()]=array[current.unix()]||[]}).pairs().sortBy(function(obj){return moment(1e3*obj[0]).unix()}).mapValues(function(array){var purchasesInInterval=array[1];return{time:array[0],purchases:purchasesInInterval,scriptsSold:purchasesInInterval.length,revenue:_(purchasesInInterval).pluck("price").reduce(_.add)||0}}).value();return scriptData}).value();return intervalStats}function getData(variable){return _(scripts).map(function(script,key,object){return{id:key,key:script.name,values:_(monthlyData[key]).mapValues(function(data){return{x:data.time,y:data[variable]}}).toArray().value()}}).value()}$scope.scripts=scripts;var earliest=_.chain(scripts).map(function(script){return _(script.purchases).filter(function(x){return 0!=x.price}).pluck("purchase_time").min()}).min().value(),latest=_.chain(scripts).map(function(script){return _(script.purchases).pluck("purchase_time").max()}).max().value();earliest=moment(1e3*earliest).startOf("month"),latest=moment(1e3*latest).startOf("month");var monthlyData=getIntervalStats("month");console.log("Got Monthly",monthlyData),$scope.revenue=getData("revenue"),$scope.numPurchases=getData("scriptsSold");var baseChart={type:"multiBarChart",height:450,margin:{top:20,right:20,bottom:60,left:45},clipEdge:!0,staggerLabels:!0,transitionDuration:500,stacked:!0,xAxis:{axisLabel:"Date",showMaxMin:!1,tickFormat:function(d){return moment(1e3*d).format("MM/YY")}}};$scope.revenueChart={chart:_.extend({yAxis:{axisLabel:"Revenue",axisLabelDistance:40,tickFormat:function(d){return d3.format("$,.1f")(d)}}},baseChart)},$scope.numPurchasesChart={chart:_.extend({yAxis:{axisLabel:"Revenue",axisLabelDistance:40,tickFormat:function(d){return d}}},baseChart)}}]),angular.module("stats").controller("LoadingCtrl",["$scope","ScriptFodder","returnTo","$state",function($scope,ScriptFodder,returnTo,$state){$scope.scriptCount=0,$scope.progress=0,$scope.numScriptsLoaded=0;var returnToOriginalState=function(){return console.log("Loading finished, returning",returnTo.state,returnTo.params,{reload:!0}),$state.go(returnTo.state,returnTo.params,{reload:!0})};ScriptFodder.loadScripts(function(scripts){$scope.scriptCount=scripts.length+1},function(script){$scope.numScriptsLoaded=$scope.numScriptsLoaded+1,$scope.currentScript=script,$scope.progress=$scope.numScriptsLoaded/$scope.scriptCount}).then(function(scriptInformation){$scope.numScriptsLoaded=$scope.numScriptsLoaded+1,returnToOriginalState()})}]),angular.module("stats").controller("DashboardCtrl",["$scope","scripts",function($scope,scripts){function aggregateScriptSales(beginTime,endTime,script){var data={};return data.revenue=_.chain(script.purchases).filter(function(purchase){return moment(1e3*purchase.purchase_time).isBetween(beginTime,endTime)}).tap(function(filtered){data.amountSold=filtered.length}).pluck("price").reduce(_.add).value(),data}function reduceParam(scriptsData,param){return _.chain(scriptsData).pluck(param).reduce(_.add).value()}function calculateTotals(dataBasis){return{revenue:reduceParam(dataBasis.scripts,"revenue"),amountSold:reduceParam(dataBasis.scripts,"amountSold")}}$scope.scripts=scripts,$scope.performance={lastMonth:{scripts:[],total:{}},thisMonth:{scripts:[],total:{}}};for(var i=0;i<scripts.length;i++)$scope.performance.lastMonth.scripts[i]=aggregateScriptSales(moment().subtract(1,"M").startOf("month"),moment().subtract(1,"M").endOf("month"),scripts[i]),$scope.performance.lastMonth.scripts[i].script=$scope.scripts[i],$scope.performance.lastMonth.date=moment().subtract(1,"M").startOf("month"),$scope.performance.thisMonth.scripts[i]=aggregateScriptSales(moment().startOf("month"),moment(),scripts[i]),$scope.performance.thisMonth.scripts[i].script=$scope.scripts[i];$scope.performance.lastMonth.total=calculateTotals($scope.performance.lastMonth),$scope.performance.thisMonth.total=calculateTotals($scope.performance.thisMonth),$scope.salesGraphData=$scope.performance.thisMonth.scripts,$scope.salesGraphOptions={chart:{type:"pieChart",height:300,margin:{top:10,right:10,bottom:10,left:10},showLegend:!1,x:function(d){return d.script.name},y:function(d){return d.revenue||0},showValues:!1,valueFormat:function(d){return d3.format("$,.2f")(d)},duration:4e3}}}]),angular.module("stats").controller("AlltimeCtrl",["$scope","scripts",function($scope,scripts){function aggregateScriptSales(beginTime,endTime,script){var data={};return data.revenue=_.chain(script.purchases).filter(function(purchase){return moment(1e3*purchase.purchase_time).isBetween(beginTime,endTime)}).tap(function(filtered){data.amountSold=filtered.length}).pluck("price").reduce(_.add).value(),data}function reduceParam(scriptsData,param){return _.chain(scriptsData).pluck(param).reduce(_.add).value()}function calculateTotals(dataBasis){return{revenue:reduceParam(dataBasis.scripts,"revenue"),amountSold:reduceParam(dataBasis.scripts,"amountSold")}}function getIntervalStats(interval){var intervalStats=_(scripts).pluck("purchases").flatten().groupBy(function(purchase){return moment(1e3*purchase.purchase_time).startOf(interval)}).mapValues(function(purchasesInInterval){return{purchases:purchasesInInterval,scriptsSold:purchasesInInterval.length,revenue:_(purchasesInInterval).pluck("price").reduce(_.add)}}).pairs().sortBy(function(obj){return moment(obj[0]).unix()}).map(function(array){return array[1].time=array[0],array[1]}).value();return intervalStats}function getMaxInterval(intervalStats){var max=_(intervalStats).pluck("revenue").max();return console.log(max),_.find(intervalStats,{revenue:max})}$scope.scripts=scripts,$scope.performance={overall:{scripts:[],total:0},records:{}};for(var i=0;i<scripts.length;i++)$scope.performance.overall.scripts[i]=aggregateScriptSales(moment(0),moment(),scripts[i]),$scope.performance.overall.scripts[i].script=$scope.scripts[i];$scope.performance.overall.total=calculateTotals($scope.performance.overall);var earliest=_.chain(scripts).map(function(script){return _(script.purchases).pluck("purchase_time").min()}).min().value();earliest=moment(1e3*earliest),_.forEach(["day","week","month"],function(interval){$scope.performance[interval]=getIntervalStats(interval),$scope.performance.records[interval]=getMaxInterval($scope.performance[interval])}),console.log($scope.performance)}]).directive("salesRecord",function(){return{restrict:"E",templateUrl:"app/statistics/alltime_sales-record.html",scope:{interval:"=",intervalName:"@",dateFormat:"@",globalCurrency:"="}}}),angular.module("stats").config(["$httpProvider",function($httpProvider){$httpProvider.defaults.useXDomain=!0}]).factory("ScriptFodder",["$resource","$localStorage","$http","$q",function($resource,$localStorage,$http,$q){var ScriptFodder={},initApi=function(){ScriptFodder.Scripts=$resource("https://scriptfodder.com/api/scripts/info/:scriptId?api_key="+$localStorage.apiKey,{scriptId:"@id"},{query:{method:"GET",url:"https://scriptfodder.com/api/scripts?api_key="+$localStorage.apiKey,isArray:!0,transformResponse:appendTransform($http.defaults.transformResponse,function(response){return response.scripts})},info:{method:"GET",transformResponse:appendTransform($http.defaults.transformResponse,function(response){return response.script})},purchases:{method:"GET",url:"https://scriptfodder.com/api/scripts/purchases/:scriptId?api_key="+$localStorage.apiKey,isArray:!0,transformResponse:appendTransform($http.defaults.transformResponse,function(response){return response.purchases=_(response.purchases).mapValues(function(val){return val.price=val.price&&parseFloat(val.price)||0,val}).toArray().value(),response.purchases})}})};return ScriptFodder.ready=!1,ScriptFodder.initialize=function(){return this.ready&&$q.resolve(),this.initializing=!0,initApi(),this.Scripts.query().$promise.then(function(){ScriptFodder.ready=!0})},ScriptFodder.loaded=!1,ScriptFodder.loadScripts=function(gotScriptsCallback,statusCallback){return ScriptFodder.initialize().then(function(){return ScriptFodder.Scripts.query().$promise}).tap(function(scripts){gotScriptsCallback(scripts)}).map(function(script){statusCallback(script);var purchasePromise=$q.delay(100).then(function(){return ScriptFodder.Scripts.purchases({scriptId:script.id})});return $q.all([script.$info(),purchasePromise]).spread(function(info,purchases){return info.purchases=purchases,info}).delay(100)},{concurrency:1}).tap(function(scriptInfo){ScriptFodder.scriptInfo=scriptInfo,ScriptFodder.loaded=!0})},ScriptFodder.getScriptInfo=function(){return this.scriptInfo},ScriptFodder.getOftenPurchasedWith=function(scriptId){var self=this;return $q.resolve().then(function(){return self.frequentSets||(self.frequentSets=$http.get("/assets/frequentSets.json").then(function(sets){return sets.data})),self.frequentSets}).then(function(frequentSets){var entry=_.find(frequentSets,function(frequentSet){return frequentSet.KeyItem==scriptId});return entry?_.filter(entry.ItemSet,function(id){return id!=scriptId}):null})},ScriptFodder.getLocalScriptInfo=function(scriptId){var self=this,data={};return data.$promise=$q.resolve().then(function(){return self.scriptInfo||(self.scriptInfo=$http.get("/assets/scripts.json").then(function(scripts){return scripts.data})),self.scriptInfo}).then(function(scripts){return _.find(scripts,function(script){return script.id==scriptId})}).then(function(script){return script?(_.extend(data,script),data):$q.reject("Script "+scriptId+" could not be found in the local db")}),data},ScriptFodder.isReady=function(){return this.ready},ScriptFodder}]),angular.module("stats").filter("percentage",["$filter",function($filter){return function(input,decimals){return $filter("number")(100*input,decimals)+"%"}}]),angular.module("ksCurrencyConvert",[]).factory("ExchangeRate",["$http",function($http){var ExchangeRate={},supportedCurrencies=["AUD","BGN","BRL","CAD","CHF","CNY","CZK","DKK","GBP","HKD","HRK","HUF","IDR","ILS","INR","JPY","KRW","MXN","MYR","NOK","NZD","PHP","PLN","RON","RUB","SEK","SGD","THB","TRY","USD","ZAR"];return ExchangeRate.getSupportedCurrencies=function(){return supportedCurrencies},ExchangeRate.isCurrencySupported=function(currencyCode){return _.findKey(supportedCurrencies,currencyCode)!==-1},ExchangeRate.getExchangeRate=function(baseCurrency,toCurrency,date,$q){if(!this.isCurrencySupported(baseCurrency))throw new Error("Invalid base currency");if(!this.isCurrencySupported(toCurrency))throw new Error("Invalid toCurrency");var multiRequest=angular.isArray(toCurrency);multiRequest||(toCurrency=[toCurrency]);var endpoint;return endpoint=angular.isDefined(date)?"https://api.fixer.io/"+moment(date).format("YYYY-MM-DD"):"https://api.fixer.io/latest",$http({url:endpoint,method:"GET",params:{base:baseCurrency,symbols:toCurrency.join(",")}}).then(function(response){return 200!=response.status?$q.reject(["Error fetching data ",response]):multiRequest?response.data:{rate:response.data.rates[toCurrency],date:response.data.date}})},ExchangeRate}]).directive("alternativeCurrency",["ExchangeRate","currencySymbolMap",function(ExchangeRate,currencySymbolMap){return{templateUrl:"app/services/alternative-currency.html",restrict:"E",scope:{toCurrency:"=",baseCurrency:"=",date:"=",amount:"="},controller:["$scope",function($scope){$scope.currencySymbol=currencySymbolMap[$scope.toCurrency],$scope.isLoading=!0,$scope.hideConverted=$scope.hideConverted||$scope.baseCurrency==$scope.toCurrency,ExchangeRate.getExchangeRate($scope.baseCurrency,$scope.toCurrency,$scope.date).then(function(data){$scope.rate=data.rate,console.log($scope.amount,data),$scope.convertedAmount=$scope.amount*data.rate,$scope.rateFrom=data.date})["catch"](function(error){console.log(error),$scope.isError=!0})["finally"](function(){$scope.isLoading=!1})}]}}]).constant("currencySymbolMap",{ALL:"L",AFN:"؋",ARS:"$",AWG:"ƒ",AUD:"$",AZN:"₼",BSD:"$",BBD:"$",BYR:"p.",BZD:"BZ$",BMD:"$",BOB:"Bs.",BAM:"KM",BWP:"P",BGN:"лв",BRL:"R$",BND:"$",KHR:"៛",CAD:"$",KYD:"$",CLP:"$",CNY:"¥",COP:"$",CRC:"₡",HRK:"kn",CUP:"₱",CZK:"Kč",DKK:"kr",DOP:"RD$",XCD:"$",EGP:"£",SVC:"$",EEK:"kr",EUR:"€",FKP:"£",FJD:"$",GHC:"¢",GIP:"£",GTQ:"Q",GGP:"£",GYD:"$",HNL:"L",HKD:"$",HUF:"Ft",ISK:"kr",INR:"₹",IDR:"Rp",IRR:"﷼",IMP:"£",ILS:"₪",JMD:"J$",JPY:"¥",JEP:"£",KES:"KSh",KZT:"лв",KPW:"₩",KRW:"₩",KGS:"лв",LAK:"₭",LVL:"Ls",LBP:"£",LRD:"$",LTL:"Lt",MKD:"ден",MYR:"RM",MUR:"₨",MXN:"$",MNT:"₮",MZN:"MT",NAD:"$",NPR:"₨",ANG:"ƒ",NZD:"$",NIO:"C$",NGN:"₦",NOK:"kr",OMR:"﷼",PKR:"₨",PAB:"B/.",PYG:"Gs",PEN:"S/.",PHP:"₱",PLN:"zł",QAR:"﷼",RON:"lei",RUB:"₽",SHP:"£",SAR:"﷼",RSD:"Дин.",SCR:"₨",SGD:"$",SBD:"$",SOS:"S",ZAR:"R",LKR:"₨",SEK:"kr",CHF:"Fr.",SRD:"$",SYP:"£",TZS:"TSh",TWD:"NT$",THB:"฿",TTD:"TT$",TRY:"",TRL:"₤",TVD:"$",UGX:"USh",UAH:"₴",GBP:"£",USD:"$",UYU:"$U",UZS:"лв",VEF:"Bs",VND:"₫",YER:"﷼",ZWD:"Z$"}),angular.module("stats").service("LoadingIndicator",[function(){this.loadingStack=new Array,this.isLoading=function(){return this.loadingStack.length>0},this.startedLoading=function(){this.loadingStack.push(!0)},this.finishedLoading=function(){this.loadingStack.pop()}}]),angular.module("stats").controller("MainCtrl",["$scope","$localStorage","$loading","ScriptFodder","$rootScope",function($scope,$localStorage,$loading,ScriptFodder,$rootScope){$scope.$storage=$localStorage,$scope.performCheck=function(){$loading.start("checkApiKey"),$scope.checkResult={},ScriptFodder.initialize().then(function(){$loading.finish("checkApiKey"),$scope.checkResult={status:"success"}},function(err){$loading.finish("checkApiKey"),$scope.checkResult={status:"error",error:err}})},$scope.$storage.apiKey&&$scope.performCheck()}]),angular.module("stats").run(["$templateCache",function($templateCache){$templateCache.put("app/about/about.html",'<div class="row content"><div class="col-md-6 col-md-offset-3 text-center"><h1>StatFodder</h1><p>Created by Kamshak. Free and open-source.</p></div></div>'),$templateCache.put("app/main/main.html",'<div class="container"><div class="row content"><div class="col-md-6 col-md-offset-3 text-center"><h1>Welcome to StatFodder</h1><p>This site can be used by scriptfodder developers to get an overview of their sales statistics. To get started enter your API key below. The site runs on javascript, your key is only saved locally and never transmitted to a server.</p><p>You can set a currency that some amounts will be converted into.</p><div class="panel panel-primary"><div class="panel-heading"><h4 class="panel-title">API Settings</h4></div><div class="panel-body" dw-loading="checkApiKey"><div ng-show="checkResult.status" class="col-md-12" style="margin-top: 15px"><div class="alert alert-success" role="alert" ng-show="checkResult.status == \'success\'"><strong>Success</strong> The api key entered is valid. You can now access the Statistics tab.</div><div class="alert alert-danger" role="alert" ng-show="checkResult.status == \'error\'"><strong>Error</strong> The api key was not valid or the SF API is down.</div></div><div class="col-md-12"><form class="form-horizontal"><div class="form-group"><label for="apiKey">API Key</label> <input type="text" class="form-control" id="apiKey" placeholder="" ng-model="$storage.apiKey"> <button type="submit" class="btn btn-default" ng-click="performCheck()" style="margin-top: 5px">Check</button></div><div class="form-group"><label for="currency">Currency</label><select id="currency" class="form-control" ng-model="$storage.globalCurrency"><option>GBP</option><option>EUR</option><option>USD</option></select></div></form></div></div></div></div></div></div>'),$templateCache.put("app/services/alternative-currency.html",'<span><span>{{amount | currency}}</span> <span ng-hide="hideConverted">| <span ng-show="isLoading"><i class="fa fa-spinner fa-pulse"></i>loading...</span> <abbr tooltip="Exchange rate {{rate}} from {{rateFrom | amCalendar}}" tooltip-placement="bottom" ng-show="!isLoading">{{scope.isError && "error"}}{{convertedAmount | currency:currencySymbol}}</abbr></span></span>'),$templateCache.put("app/statistics/alltime.html",'<h1>All-time Script Statistics</h1><div class="row"><div class="col-md-12"><div class="panel panel-default"><div class="panel-heading">Total Revenue</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.overall.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" base-currency="\'USD\'" amount="performance.overall.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.scripts"></nvd3></div></div></div></div></div></div><div class="row"><div class="col-md-4"><sales-record interval="performance.records.day" interval-name="Day" date-format="dddd, MMMM Do YYYY" global-currency="$storage.globalCurrency"></sales-record></div><div class="col-md-4"><sales-record interval="performance.records.week" interval-name="Week" date-format="[Week] W of YYYY (MMMM Do YYYY [+ 7 Days])" global-currency="$storage.globalCurrency"></sales-record></div><div class="col-md-4"><sales-record interval="performance.records.month" interval-name="Month" date-format="MMMM YYYY" global-currency="$storage.globalCurrency"></sales-record></div></div>'),$templateCache.put("app/statistics/alltime_sales-record.html",'<div class="panel panel-default"><div class="panel-heading"><h4>Best {{intervalName}}</h4><h6>{{ interval.time | amDateFormat:dateFormat }}</h6></div><div class="panel-body"><p><strong>Revenue</strong>:<alternative-currency to-currency="globalCurrency" date="interval.time" base-currency="\'USD\'" amount="interval.revenue"></alternative-currency></p><p><strong>Scripts Sold</strong>: {{ interval.scriptsSold }}</p></div></div>'),$templateCache.put("app/statistics/dashboard.html",'<h1>Dashboard</h1><div class="row"><div class="col-md-6"><div class="panel panel-default"><div class="panel-heading">This Month</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.thisMonth.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" base-currency="\'USD\'" amount="performance.thisMonth.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.thisMonth.scripts"></nvd3></div></div></div></div></div><div class="col-md-6"><div class="panel panel-default"><div class="panel-heading">Last Month</div><div class="panel-body"><p><strong>Scripts Sold</strong>: {{performance.lastMonth.total.amountSold}}</p><p><strong>Revenue</strong>:<alternative-currency to-currency="$storage.globalCurrency" date="performance.lastMonth.date" base-currency="\'USD\'" amount="performance.lastMonth.total.revenue"></alternative-currency></p><div class="row"><div class="col-md-12"><nvd3 options="salesGraphOptions" data="performance.lastMonth.scripts"></nvd3></div></div></div></div></div></div>'),$templateCache.put("app/statistics/loading.html",'<h1><i class="fa fa-spinner fa-spin fa-fw"></i> Loading Script Information</h1><div class="row text-center"><div class="col-md-12"><small>Loading <em>{{currentScript.name || "Script List"}}</em></small><progressbar max="1" class="progress-striped active" value="progress" type="info"><b>{{progress | percentage:0}}</b></progressbar></div></div>'),$templateCache.put("app/statistics/monthly.html",'<div class="row"><div class="col-md-12"><h1>Sales Distribution</h1><h2>By Revenue</h2><nvd3 options="revenueChart" data="revenue"></nvd3><h2>By number of purchases</h2><nvd3 options="numPurchasesChart" data="numPurchases"></nvd3></div></div>'),$templateCache.put("app/statistics/revenue.html",'<h1>Daily Statistics</h1><h2>Scripts</h2><div class="btn-group"><label ng-repeat="script in scripts" class="btn btn-primary" ng-model="checkModel[$index]" btn-checkbox="">{{script.name}}</label></div><h2>Timespan</h2><input date-range-picker="" class="form-control date-picker" type="text" min="minDate" max="maxDate" ng-model="dateRange"><div id="revenue"></div><div id="number"></div><div class="legend"></div>'),$templateCache.put("app/statistics/statistics.html",'<div class="col-md-3" role="complementary"><nav class="bs-docs-sidebar hidden-print hidden-xs hidden-sm"><ul class="nav bs-docs-sidenav"><li ui-sref-active="active"><a ui-sref="statistics.dashboard">Dashboard</a></li><li ui-sref-active="active"><a ui-sref="statistics.revenue">Daily Revenue Analyzer</a></li><li ui-sref-active="active"><a ui-sref="statistics.monthly">Sales Distribution / Monthly stats</a></li><li ui-sref-active="active"><a ui-sref="statistics.alltime">All Time Stats / Records</a></li></ul></nav></div><div class="col-md-9" ui-view=""></div>'),$templateCache.put("app/components/navbar/navbar.html",'<nav class="navbar navbar-static-top navbar-default" ng-controller="NavbarCtrl"><div class="container"><div class="navbar-header"><a class="navbar-brand" href="https://kamshak.github.io/scriptfodder-stats/"><span class="fa fa-line-chart"></span> StatFodder</a><div class="navbar-brand has-spinner" ng-show="loadingIndicator.isLoading()"><i class="spinner fa fa-spinner fa-1x fa-spin"></i></div></div><div class="collapse navbar-collapse" id="bs-example-navbar-collapse-6"><ul class="nav navbar-nav"><li ui-sref-active="active"><a ui-sref="home">Home</a></li><li ui-sref-active="active" ng-show="ScriptFodder.isReady()"><a ui-sref="statistics">Statistics</a></li><li ui-sref-active="active"><a ui-sref="about">About</a></li></ul><ul class="nav navbar-nav navbar-right"><li><a href="https://github.com/Kamshak/scriptfodder-stats"><span class="fa fa-github"></span> scriptfodder-stats</a></li></ul></div></div></nav>')}]);