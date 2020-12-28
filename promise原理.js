/**
 * https://juejin.cn/post/6910858750354325518#heading-3
 * @param {*} executor 
 */
function Promise(executor) {
    var self = this;
    self.status = 'pending';
    self.value;
    self.reason;
    self.onResolvedCallbacks = []; // 存放所有成功的回调。
    self.onRejectedCallbacks = []; // 存放所有失败的回调。
    function resolve(value) {
        if (self.status === 'pending') {
            self.status = 'resolved';
            self.value = value;
            self.onResolvedCallbacks.forEach(function (fn) {
                fn();
            })
        }
    }

    function reject(reason) {
        if (self.status === 'pending') {
            self.status = 'rejected';
            self.reason = reason;
            self.onRejectedCallbacks.forEach(function (fn) {
                fn();
            })
        }
    }
    try {
        executor(resove, reject);
    } catch (e) {
        reject(e);
    }
}

function resolvePromise (promise2, x, resolve, reject) {
    if (promise2 === x) { // 防止自己等待自己
        return reject(new TypeError('循环引用了'));
    }
    let called; // 表示Promise有没有被调用过
    // x是object或者是个function
    if ((x !== null && typeof x === 'object') || typeof x === 'function') {
        try {
            let then = x.then;
            if (typeof then === 'function') {
                then.call(x, function (y) {
                    if (called) { // 是否调用过
                        return;
                    }
                    called = true;
                    resolvePromise (promise2, y, resolve, reject)
                }, function (r) {
                    if (called) { // 是否调用过
                        return;
                    }
                    called = true;
                    reject(r);
                });
            } else { // 当前then是一个普通对象。
                resolve(x)
            }
        } catch (e) {
            if (called) { // 是否调用过
                return;
            }
            called = true;
            reject(e);
        }
    } else {
        if (called) { // 是否调用过
            return;
        }
        called = true;
        resolve(x);
    }
}

Promise.prototype.then = function(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (data) { return data;};
    onRejected = typeof onRejected === 'function' ? onRejected : function (err) { throw err;};
    var self = this;
    const promise2 = new Promise(function (resolve, reject) {
        if (self.status === 'resolved') {
            setTimeout(function() {
                try {
                    const x = onFulfilled(self.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch(e) {
                    reject(e);
                } 
            }, 0)
        }

        if (self.status === 'rejected') {
            setTimeout(function() {
                try {
                    const x = onRejected(self.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch(e) {
                    reject(e);
                }
            }, 0)
        }
        if (self.status === 'pending') {
            self.onResolvedCallbacks.push(function () {
                setTimeout(function() {
                    try {
                        const x = onFulfilled(self.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(e) {
                        reject(e);
                    }
                }, 0)
            });
            self.onRejectedCallbacks.push(function() {
                setTimeout(function() {
                    try {
                        const x = onRejected(self.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(e) {
                        reject(e);
                    }
                }, 0)
            });
        }
    })
    return promise2;
}


//Promise静态方法实现
Promise.all = function (values) {
    return new Promise(function (resolve, reject) {
        var arr = []; // 最终结果的数组
        var index = 0;

        function processData (key, value) {
            index++;
            arr[key] = value;
            if (index === values.length) {
                resolve(arr);
            }
        }

        for (var i = 0; i < values.length; i++) {
            var current = values[i];
            if (current && current.then && typeof current.then === 'function') {
                current.then(function(y) {
                    processData(i, y);
                }, reject);
            } else {
                processData(i, current);
            }
        }
    });
}

Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
        for (var i = 0; i < values.length; i++) {
            var current = values[i];
            if (current && current.then && typeof current.then === 'function') {
                current.then(resolve, reject);
            } else {
                resolve(current);
            }
        }
    });
}

Promise.resolve = function(value){
    return new Promise((resolve,reject)=>{
        resolve(value);
    });
}

Promise.reject = function(reason){
    return new Promise((resolve,reject)=>{
        reject(reason);
    });
}
