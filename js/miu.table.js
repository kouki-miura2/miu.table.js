// miu.table.js
// v1.0
// (c)2022 miu-soft
// MIT license - https://opensource.org/licenses/MIT

var miu = miu || {};
miu.table = function(id) {

    this.div    = document.getElementById(id);

    this.p    = null; // params
    this.data = null;
    this.temp = null;
    this.emsg = {};
    this.pwd1 = null;
    this.pp   = {     // password param
        'reenter' : 'Re-enter password',
        'notmatch': 'Password does not match. Re-enter password twice'
    };

    this.C = null; // params for create
    this.R = null; // params for read
    this.U = null; // params for update
    this.D = null; // params for delete

    this.pager = null;  // pager
    this.psize = 0;     // page size
    this.pidx  = 0;     // page index
    this.sidx  = null;  // selected row index in data

    this.skey  = 0;     // sort key index
    this.desc  = false; // sort desc

    this.def = {
        'C': { 'action': {'CANCEL':'CANCEL','CONFIRM':'CONFIRM','RETURN':'RETURN','COMMIT':'ADD'} },
        'R': { 'action': {'CANCEL':'CANCEL'} },
        'U': { 'action': {'CANCEL':'CANCEL','CONFIRM':'CONFIRM','RETURN':'RETURN','COMMIT':'UPDATE'} },
        'D': { 'action': {'CANCEL':'CANCEL','CONFIRM':'CONFIRM','COMMIT':'DELETE'} }
    };

    // set params
    // p.title : 'miu-table.js'
    // p.action: {'C':'ADD','R':'VIEW','U':'EDIT','D':'DEL'}
    // p.names : ['ID','Name','Active']
    // p.keys  : ['id','name','active_flg']
    // p.types : ['number','text','bool'] // type is html input type except bool
    // p.psize : [10,20]
    // p.rdiv  : ' | '
    // p.runit : ' rows'
    // p.pdiv  : ' | '
    // p.punit : ' page'
    // p.pfill : true
    // p.sort  : true
    this.set = function(p) {
        this.p = p;
    };

    // set password params
    // pp.
    this.setpp = function(pp) {
        this.pp = pp;
    };

    // init title, action, list table, pager
    this.init = function(data) {
        // data
        this.data = data;
        if (this.p.psize != null) {
            this.psize = this.p.psize[0];
        } else {
            this.psize = this.data.length;
        }
        // sort
        if (this.p.sort) {
            this.data.sort((a, b)=>this._sort(a, b));
        }
        // list
        this._list();
    };

    this._sort = function(a, b) {
        var aVal = a[this.p.keys[this.skey]];
        var bVal = b[this.p.keys[this.skey]];
        if (aVal < bVal) {
            return this.desc ? 1 : -1;
        } else if (bVal < aVal) {
            return this.desc ? -1 : 1;
        }
        return 0;   
    };

    this._list = function() {
        // purge
        while (this.div.firstChild) {
            this.div.removeChild(this.div.firstChild);
        }
        // title
        this._title(this.p.title);
        // action
        this._action();
        // list table
        this._listTable();
        // pager
        this._pager();
    };

    this._title = function(title) {
        if (title != null) {
            let div = document.createElement('div');
            div.className = 'title';
            let tc = document.createTextNode(title);
            div.appendChild(tc);
            this.div.appendChild(div);
        }
    };

    this._action = function() {
        let my = this;

        if (this.p.action != null) {
            let div = document.createElement('div');
            div.className = 'action';
            let keys = Object.keys(this.p.action);
            for (let i = 0; i < keys.length; i++) {
                if (0 < i) {
                    div.appendChild(document.createTextNode(' | '));
                }
                let a = document.createElement('a');
                a.href = 'javascript:null';
                if ('C' == keys[i] || this.sidx != null) {
                    a.onclick = function() {
                        my._initTemp(keys[i]);
                        my._detail(keys[i]);
                    };
                } else {
                    a.className = 'disabled';
                }
                let ac = document.createTextNode(this.p.action[keys[i]]);
                a.appendChild(ac);
                div.appendChild(a);
            }
            this.div.appendChild(div);
        }
    };

    this._initTemp = function(mode) {
        if ('C' == mode) {
            this.sidx = null;
        }
        this.temp = null;
        this.emsg = {};
        if ('U' == mode) {
            // copy data to temp
            let my = this;
            this.temp = {};
            this.U.keys.forEach(function(key) {
                my.temp[key] = my.data[my.sidx][key];
            });
        }
    };

    this._listTable = function() {
        let my = this;

        let tbl = document.createElement('table');
        tbl.className = 'list-table';
        // th
        let h = tbl.insertRow();
        var i = 0;
        this.p.names.forEach (function (n) {
            let th = document.createElement('th');
            th.innerText = n;
            if (my.p.sort) {
                if (my.skey == i) {
                    th.innerHTML = th.innerText + (my.desc ? ' &uarr;' : ' &darr;');
                }
                let idx = i;
                th.onclick = function() {
                    if (my.skey == idx) {
                        my.desc = !my.desc;
                    } else {
                        my.skey = idx;
                        my.desc = false;
                    }
                    my.data.sort((a, b)=>my._sort(a, b));
                    my._list();
                };
            }
            h.appendChild(th);
            i++;
        });
        // td
        let start = this.psize * this.pidx;
        let end   = this.psize * (this.pidx + 1);
        let dend  = Math.min(this.data.length, end);
        if (!this.p.pfill) {
            end = dend;
        }
        // determine of selectable
        let sel  = 'action' in this.p &&
            ('R' in this.p.action || 'U' in this.p.action || 'D' in this.p.action);
        for (let i = start; i < end; i++) {
            let r = tbl.insertRow();
            let j = 0;
            this.p.keys.forEach (function (k) {
                let td = document.createElement('td');
                if (i < dend) {
                    td.innerText = my._viewText(my.p.types[j], my.data[i][k]);
                } else {
                    r.className = 'no-data';
                    td.innerHTML = '&nbsp;';
                }
                r.appendChild(td);
                j++;
            });
            if (i < dend && sel) {
                r.className = this.sidx == i ? 'selected' : 'selectable';
                r.onclick = function () { my._select(i); }
            }
        }
        this.div.appendChild(tbl);
    };

    this._viewText = function(type, val) {
        if (type == 'bool') {
            return val ? 'Y' : 'N';
        } else if (type == 'password') {
            return val.replace(/./g, '*');
        }
        return val;
    };

    this._pager = function() {
        if (this.pager != null) {
            this.pager.remove();
        }
        if (this.p.psize != null && 0 < this.p.psize.length) {
            this.pager = document.createElement('div');
            this.pager.className = 'pager';
            this._psize();
            this._pidx();
            this.div.appendChild(this.pager);
            // pager width fix to list-table
            let listTableWidth = this.pager.previousElementSibling.getBoundingClientRect().width;
            this.pager.style.width = listTableWidth + 'px';
        }
    };

    this._psize = function() {
        let my  = this;
        let div = document.createElement('div');
        div.className = 'rows';

        for (let i = 0; i < this.p.psize.length; i++) {
            if (0 < i) {
                div.appendChild(document.createTextNode(
                        this.p.rdiv ? this.p.rdiv : ' | '));
            }
            let size = this.p.psize[i];
            let ac = document.createTextNode(size);
            let a = document.createElement('a');
            a.href = 'javascript:null;';
            a.onclick = function(e) {
                my.psize = size;
                my.pidx  = 0;
                my.sidx  = null;
                my._list();
            };
            a.appendChild(ac);
            div.appendChild(a);
        }

        let span = document.createElement('span');
        span.className = 'rows-unit';
        span.appendChild(document.createTextNode(
                this.p.runit ? this.p.runit : ' ROWS'));
        div.appendChild(span);

        this.pager.appendChild(div);
    };

    this._pidx = function() {
        let my  = this;
        let div = document.createElement('div');
        div.className = 'pages';

        let pmax = (this.data.length - 1) / this.psize + 1;
        this.plist = [];
        for (let i = 1; i <= pmax; i++) {
            if (1 < i) {
                div.appendChild(document.createTextNode(
                        this.p.pdiv ? this.p.pdiv : ' | '));
            }
            let ac = document.createTextNode(i);
            let a = document.createElement('a');
            a.href = 'javascript:null;';
            a.onclick = function(e) {
                my.pidx = i - 1;
                my.sidx = null;
                my._list();
            };
            a.appendChild(ac);
            div.appendChild(a);
        }

        let span = document.createElement('span');
        span.className = 'page-unit';
        span.appendChild(document.createTextNode(
                this.p.punit ? this.p.punit : ' PAGE'));
        div.appendChild(span);

        this.pager.appendChild(div);
    };

    this._select = function(i) {
        if (this.sidx == i) {
            this.sidx = null;
        } else {
            this.sidx = i;
        }
        this._list();
    };

    // mode = 'C','R','U','D'
    this._detail = function(mode, cnfm=false) {
        // set params
        if (this[mode] == null) {
            this[mode] = {
                'action': this.def[mode].action,
                'names' : this.p.names,
                'keys'  : this.p.keys,
                'types' : this.p.types
            };
        }
        // purge
        while (this.div.firstChild) {
            this.div.removeChild(this.div.firstChild);
        }
        // title
        this._title('title' in this[mode] ?
            this[mode].title :
                this.p.title + ' | ' + this.p.action[mode]);
        // cancel
        this._cancelAction(mode, cnfm);
        // detail table
        if (cnfm) {
            this.pwd1 = null;
        }
        this._detailTable(mode, cnfm);
        // action
        this._detailAction(mode, cnfm);
    };

    this._cancelAction = function(mode, cnfm) {
        let my  = this;
        let div = document.createElement('div');

        div.className = 'action';
        let a = document.createElement('a');
        a.href = 'javascript:null';
        a.onclick = function() { cnfm ? my._return(mode) : my._cancel(); };
        let ac = document.createTextNode(this[mode].action[cnfm ? 'RETURN' : 'CANCEL']);
        a.appendChild(ac);
        div.appendChild(a);
        this.div.appendChild(div);
    };

    this._cancel = function() {
        this._list();
    };

    this._return = function(mode) {
        this._detail(mode);
    };

    this._detailTable = function(mode, cnfm) {
        let tbl = document.createElement('table');
        tbl.className = 'detail-table';
        var firstTd = null;
        for (let i = 0; i < this[mode].names.length; i++) {
            let r = tbl.insertRow();
            // th
            let th = document.createElement('th');
            th.innerText = this[mode].names[i];
            r.appendChild(th);
            // td
            let td = document.createElement('td');
            this._item(td, mode, cnfm, i);
            r.appendChild(td);
            if (firstTd == null) {
                firstTd = td;
            }
        }
        this.div.appendChild(tbl);

        // focus
        if (!cnfm && mode == 'C') {
            firstTd.firstChild.focus();
        }
    };

    this._item = function(td, mode, cnfm, iidx) {
        let type = this[mode].types[iidx] == 'bool' ?
            'checkbox' : this[mode].types[iidx];
        if ((mode == 'C' || mode == 'U') && !cnfm) {
            td.innerHTML = type != 'textarea' ?
                '<input type="' + type + '">' :
                '<textarea></textarea>';
            if (this.temp) {
                let input = td.firstChild;
                if (type == 'checkbox') {
                    input.checked = this.temp[this[mode].keys[iidx]] == 1;
                } else if (type != 'password' || this.pwd1 == null) {
                    input.value = this.temp[this[mode].keys[iidx]];
                }
            }
            if (this[mode].keys[iidx] in this.emsg) {
                let div = document.createElement('div');
                div.className = 'emsg';
                div.textContent = this.emsg[this[mode].keys[iidx]];
                td.appendChild(div);
            }
        } else {
            let val = cnfm ?
                this.temp[this[mode].keys[iidx]] :
                this.data[this.sidx][this[mode].keys[iidx]];
            td.innerText = this._viewText(
                this[mode].types[iidx], val);
        }
    };

    this._detailAction = function(mode, cnfm) {
        if (mode == 'R') {
            return;
        }
        let my = this;

        let div = document.createElement('div');
        div.className = 'action';
        let a = document.createElement('a');
        a.href = 'javascript:null';
        a.onclick = function() {
            if (cnfm) {
                switch (mode) {
                    case 'C': my._create(); break;
                    case 'U': my._update(); break;
                }
                return;
            } else {
                my._saveTemp(mode);
                if (mode == 'D') {
                    my._delete();
                    return;
                }
                my._valid(mode);
                if (0 < Object.keys(my.emsg).length) {
                    my._detail(mode);
                    return;
                }
            }
            my._detail(mode, true);
        };
        let ac = document.createTextNode(this[mode].action[cnfm ? 'COMMIT' : 'CONFIRM']);
        a.appendChild(ac);
        div.appendChild(a);
        this.div.appendChild(div);
    };

    this._saveTemp = function(mode) {
        let tbl = this.div.querySelector('table');
        this.temp = {};
        for (let i = 0; i < this[mode].names.length; i++) {
            let input = tbl.rows[i].cells[1].firstChild;
            this.temp[this[mode].keys[i]] = mode == 'D' ?
                (input == null ? null : input.textContent) :
                (input.getAttribute('type') == 'checkbox' ?
                    (input.checked ? 1 : 0) : input.value);
        }
    };

    this._valid = function(mode) {
        if (this[mode].regex == null) {
            return;
        }
        this.emsg = {};
        for (let i = 0; i < this[mode].names.length; i++) {
            let v = this.temp[this[mode].keys[i]];
            if (this[mode].regex[i] != null) {
                if (!this[mode].regex[i].test(v)) {
                    this.emsg[this[mode].keys[i]] = this[mode].emsg[i];
                }
            }
            if (this[mode].types[i] == 'password' &&
                    !(this[mode].keys[i] in this.emsg)) {

                if (this.pwd1 == null) {
                    this.emsg[this[mode].keys[i]] = this.pp.reenter;
                    this.pwd1 = v;
                } else if (v != this.pwd1) {
                    this.emsg[this[mode].keys[i]] = this.pp.notmatch;
                    this.temp[this[mode].keys[i]] = null;
                    this.pwd1 = null;
                }
            }
        }
        this.emsg = Object.keys(this.emsg).length < 1 ? {} : this.emsg;
    };

    this._create = function() {
        var ok = true;
        if (typeof this.C.func == 'function') {
            ok = this.C.func(this.temp);
        }
        if (ok) {
            this.data.push(this.temp);
            this.data.sort((a, b)=>this._sort(a, b));
            this._list();
        }
    };

    this._update = function() {
        var ok = true;
        if (typeof this.U.func == 'function') {
            ok = this.U.func(this.temp);
        }
        if (ok) {
            // copy temp to data
            let my = this;
            this.U.keys.forEach(function(key) {
                my.data[my.sidx][key] = my.temp[key];
            });
            this.data.sort((a, b)=>this._sort(a, b));
            this._list();
        }
    };

    this._delete = function() {
        var ok = true;
        if (typeof this.D.func == 'function') {
            ok = this.D.func(this.temp);
        }
        if (ok) {
            this.data.splice(this.sidx, 1);
            this.pidx = 0;
            this.sidx = null;
            this._list();
        }
    };

};
