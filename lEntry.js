/**
 * @name     LEntry.js
 * @desc     录入信息表单提交插件（适用于本项目）
 * @depend   jQuery
 * @author   Heimayu
 * @date     2016-8-01
 * @URL      http://webhmy.com
 * @reutn    {jQuery}
 * @version  1.0.1
 *
 */

/** 插件要求
 * 1. 将要校验和提交的表单命class名与后台所需提交的参数名称一致;
 * 2. 有上传图片的，img标签加入data-rel属性，为所提交图片参数名;
 * 3. 提交参数有更改的请在beforeSend函数中操作;
 * 4. 有邮箱、手机号、身份证号校验的放在对应的对象里，也可在beforeSend函数中自己校验;
 * 5. 本插件简单轻巧，适用于ajax提交表单应用且灵活性很强，你根据自己常用校验拓展正则;
 * 6. 对于多个重复的表单块提交，只需设置isManyObject为true即可，默认为false,默认多个对象放置list数组里，数组名可更改；
 * 7. 本插件所有权属黑玛鱼，如有疑问，请置疑www.webhmy.com     
 */
(function($) {
    /** 匹配类型正则表达式
     * 1. 是否为数字
     * 2. IP地址
     * 3. 网址
     * 4. 邮箱
     * 5. 日期格式
     * 6. 身份证号
     * 7. 手机号码
     * 8. 电话号码 (3-4位区号，7-8位直播号码，1－4位分机号)
     * 9. 密码（6-20）位     
     */
    var exps = {
        number: /^[-]?\d+(\.\d+)?$/,
        ip: /^((?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d))))$/,
        url: /^((https?|ftp|news):\/\/)?([a-z]([a-z0-9\-]*[\.。])+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel)|(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&]*)?)?(#[a-z][a-z0-9_]*)?$/,
        email: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/,
        date: /^((((1[6-9]|[2-9]\d)\d{2})-(0?[13578]|1[02])-(0?[1-9]|[12]\d|3[01]))|(((1[6-9]|[2-9]\d)\d{2})-(0?[13456789]|1[012])-(0?[1-9]|[12]\d|30))|(((1[6-9]|[2-9]\d)\d{2})-0?2-(0?[1-9]|1\d|2[0-8]))|(((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))-0?2-29-))$/,
        idCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
        phone: /^1[3|4|5|8|7][0-9]\d{8}$/,
        mobile: /^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$/,
        password: /^(\w){6,20}$/
    };

    var LEntry = function(elem, option) {

        this.config = $.extend({}, this.defaults, option);
        this.elem = $(elem);
        this.data = this.config.data;

        // 加载回调函数 this.config.init
        if ($.isFunction(this.config.init)) {
            this.config.init.apply(this.elem);
        };

        this._init();
    };

    LEntry.prototype = {

        /**
         * 默认配置
         * @type {Object}
         */
        defaults: {
            param: {}, //提交数据
            data: null, //传参数据
            ajaxUrl: null, //post地址
            afterUrl: null, //提交后跳转的URL
            afterClean: false, //提交后清空
            isManyObject: false, //是否多个对象
            init: null, // 加载完后回调 
            beforeSend: null, // 提交之前函数  
            success: null, // 提交成功回调
            error: null //提交失败后回调          
        },

        /**
         * 提交表单触发器
         * @return {null}
         */
        _init: function() {

            var _this = this;

            this.elem.off('click').on('click', function() {
                _this._check();
            });
        },

        /**
         * 提交表单校验中心
         * @return {null}
         */
        _check: function() {

            var _this = this;

            //是否为空            
            if (this.config.isManyObject) {
                var list = _this._manyCheck();
                if (!list) return false;

                _this.config.param.list = JSON.stringify(list);
            } else {

                for (var i in this.data) {

                    var isObject = this.data[i] instanceof Object;

                    if (!isObject) {

                        if (!_this._oneCheckIsNull(i, $('.' + i))) return false;

                        var target = $('.' + i)[0].tagName,
                            type = $('.' + i)[0].type;

                        if (target == 'INPUT' && type == 'file') { //图片

                            _this.config.param[i] = $('img[data-del="' + i + '"]').attr('src');
                        } else {
                            _this.config.param[i] = $('.' + i).val();
                        };

                    } else {

                        var subData = this.data[i];

                        for (var k in subData) {

                            if (!_this._oneCheckIsLegal(i, k, $('.' + k))) return false;

                            _this.config.param[k] = $('.' + k).val();
                        };
                    };
                };
            };

            //发送之前执行回调
            if ($.isFunction(_this.config.beforeSend)) {

                var result = _this.config.beforeSend.call(_this.elem, _this.config.param);
                if (result) _this._post();

            } else {

                _this._post();
            }
        },

        /**
         * 验证单个表单是否为空
         * @return {null}
         */
        _oneCheckIsNull: function(i, obj) { //类名+对象

            var val = obj.val(),
                target = obj[0].tagName,
                type = obj[0].type,
                result = true,
                title;

            if (target == 'SELECT' || (target == 'INPUT' && type == 'file')) {
                title = "请选择";
            } else if (target == 'INPUT' && type == 'text') {
                title = "请输入";
            };

            if (!val.replace(/(^\s*)|(\s*$)/g, "")) {

                alert(title + this.data[i]);

                obj.focus();

                result = false;
                return false;
            };

            return result;
        },

        /**
         * 验证正则
         * @return {null}
         */
        _oneCheckIsLegal: function(i, k, obj) { //类名+子类名+子对象

            //判空
            var _this = this,
                subVal = obj.val(),
                result = true;

            if (!subVal.replace(/(^\s*)|(\s*$)/g, "")) {

                alert('请输入' + _this.data[i][k]);
                result = false;
                obj.focus();

                return false;
            };

            //正则判断                        
            var reg = new RegExp(exps[i]);
            if (subVal != '' && subVal.length > 0) {
                if (!reg.test(subVal)) {

                    alert(_this.data[i][k] + '格式不正确');
                    result = false;
                    obj.focus();
                    return false;
                };
            };

            return result;
        },

        /**
         * 多个表单块提交
         * @return {null}
         */
        _manyCheck: function() {

            var _this = this,
                list = [],
                len;

            //获取对象个数
            for (var i in this.data) {

                len = $('.' + i).length;

                if (len) break;
            };

            //创建对应的空对象
            for (var j = 0; j < len; j++) {

                var data = {};
                list.push(data);
            };

            for (var name in this.data) {

                var isObject = this.data[name] instanceof Object;

                for (var k = 0; k < len; k++) {

                    if (!isObject) {

                        if (!_this._oneCheckIsNull(name, $('.' + name).eq(k))) return false;

                        var target = $('.' + name).eq(k)[0].tagName,
                            type = $('.' + name).eq(k)[0].type;

                        if (target == 'INPUT' && type == 'file') { //图片

                            list[k][name] = $('img[data-del="' + name + '"]').attr('src');
                        } else {
                            list[k][name] = $('.' + name).eq(k).val();
                        };
                    } else {

                        var subData = this.data[name];

                        for (var w in subData) {

                            if (!_this._oneCheckIsLegal(name, w, $('.' + w).eq(k))) return false;

                            list[k][w] = $('.' + w).eq(k).val();
                        };
                    };
                }
            };

            return list;
        },

        /**
         * 请求发送
         * @return {null}
         */
        _post: function() {

            var _this = this;

            $.ajax({
                url: _this.config.ajaxUrl,
                data: _this.config.param,
                type: 'post',
                dataType: 'json',
                success: function(r) {

                    if ($.isFunction(_this.config.error)) {
                        _this.config.error.apply(_this.elem);
                    } else {
                        if (r.result != 1) {
                            alert(r.msg || '发生未知错误，请重试');
                            return false;
                        };
                    };

                    if (_this.config.afterClean) {

                        alert('提交成功！');
                        for (var i in this.data) {

                            $('.' + i).val('');
                        };
                    } else if (_this.config.afterUrl) {

                        alert('提交成功，正在为您跳转至列表界面！');
                        setTimeout(function() {
                            window.location.href = _this.config.afterUrl;
                        }, 2000);

                    } else if ($.isFunction(_this.config.success)) {
                        _this.config.success.apply(_this.elem);
                    } else {
                        alert('提交成功！');
                    };
                }
            });
        }
    };

    // 扩展jQuery
    $.fn.LEntry = function(option) {

        return this.each(function() {
            new LEntry(this, option);
        });
    };

})(jQuery);