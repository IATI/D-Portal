(function(exports, global) {
    global["ctrack"] = exports;
    exports.chunks = {
        chunk1: "\nThis is some {test} data! \n",
        chunk2: "\nThis is some more data\n{chunk1}\n",
        loading: "\n<b>Please wait, requesting data from iati-datastore...</b>\n",
        preparing: "\n<b>Please wait, preparing page...</b>\n",
        dump_act: '<a href="#ctrack_index">BACK</a>\n<table>\n<tr><td>id:</td><td>{id}</td></tr>\n<tr><td>title:</td><td>{title}</td></tr>\n<tr><td>status:</td><td>{status} ({status-code})</td></tr>\n<tr><td>start-date:</td><td>{start-date}</td></tr>\n<tr><td>end-date:</td><td>{end-date}</td></tr>\n<tr><td>description:</td><td>{description}</td></tr>\n</table>\n<br/>\n\n',
        title: "Country Tracker\n",
        bodytest: '{ctnav}\n<div style="width:1040px; margin:0 auto; background-color:#fff; padding-top:110px;">\n{cthead}\n{ctbox1}\n{ctbox1table}\n{ctbox1more}\n{ctboxes}\n{ctnear}\n{ctfooter}\n{ctfind}\n</div>\n\n</div>\n',
        ctnav: '<div style="width:100%; background-color:#96CBFF; border-bottom:11px solid #BDD9FC; height:90px; position:fixed;">\n<div style="width:960px; margin:0 auto; color:#fff; font-size:32px; padding-top:30px;">\n<div style="display:inline-block; vertical-align:top; width:760px; height:30px;"><a href="#"><img src="art/ctlogo.png" alt="Country Tracker logo" width="350" height="30"/></a></div><div style="width:200px; display:inline-block; text-align:right;"><a href="#about" class="navabout">About</a></div>\n</div>\n</div>\n\n',
        divtop: '<div style="width:1040px; margin:0 auto; background-color:#fff;">',
        divbot: "</div>\n\n",
        cthead: '<div style="width:960px; margin:0 auto; color:#444; padding-top:40px;">\n<div style="display:inline-block; vertical-align:top; width:150px; height:90px;"><img src="art/bgflag.png" alt="Bangladesh flag" width="150" height="90"/></div><div style="display:inline-block; vertical-align:top; padding-left:20px;">\n<div style="color:#8E9092; font-size:32px;">What\'s going on?</div><div style="font-size:64px; letter-spacing:5px; color:#444; line-height:1.0em;">BANGLADESH</div></div><a title="This denotes the current cut-off time for the current data population and will not be visible in the widget." style="display:inline-block; vertical-align:top; padding-left:100px; text-align:center; color:#ccc; font-size:32px;"><div style="font-size:20px;">TIME STAMP</div><div style="color:#bbb;">{today}</div></a>\n</div>\n\n\n\n',
        ctbox1: '<div style="width:954px; margin:0 auto; color:#444; margin-top:40px; border:3px solid #D8D8D8;">\n<div style="width:634px; padding:30px; display:inline-block; vertical-align:top; border-right:3px solid #D8D8D8; max-height:240px;">{ctactive}</div><div style="display:inline-block; vertical-align:top; width:257px; max-height:240px;"><div style="padding:20px 10px 10px 30px; border-bottom:3px solid #D8D8D8; height:50%;">{ctactivities}</div><div style="padding:20px 10px 10px 30px; height:50%;">{ctpublishers}</div></div>\n</div>\n\n\n\n',
        ctactive: '<div style="padding-left:10px; font-size:32px; color:#A5BBC0;">Active Projects</div>\n<div style="font-size:128px; color:#444;">{active_projects}</div>\n\n\n\n',
        ctactivities: '<div style="padding-left:5px;font-size:20px; color:#A5BBC0;">Total Projects</div>\n<div style="font-size:56px; color:#444;">{total_projects}</div>\n\n\n\n',
        ctpublishers: '<div style="padding-left:5px;font-size:20px; color:#A5BBC0;">Publishers</div>\n<div style="font-size:56px; color:#444;">{numof_publishers}</div>\n\n\n\n',
        ctbox1table_data: '<tr><td>{num}.</td><td><div><a href="#ctrack_activity" activity="{activity}">{title}</a></div></td><td>{date}</td></tr>\n',
        ctbox1table: '<table class="box1">\n<tr><td colspan="2" style="font-size:12px; color:#666; line-height:2.0em;">ENDING SOON</td><td style="font-size:12px; color:#666; line-height:2.0em;">END DATE</td></tr>\n{ctbox1table_datas}\n</table>\n',
        old: '<tr><td>1.</td><td><div>Paribarvittik Jeboboichittra Gram (PJG) Project</div></td><td>334461</td></tr>\n<tr><td>2.</td><td><div>Flood Resistant Shelter for South-West region in Bangladesh (FRESH)</div></td><td>1612124</td></tr>\n<tr><td>3.</td><td><div>Empowering Women RMG Workers Project Bangladesh</div></td><td>313887</td></tr>\n<tr><td>4.</td><td><div>Flood Resistant Shelter for South-West region in Bangladesh (FRESH)</div></td><td>1612124</td></tr>\n<tr><td>5.</td><td><div>Empowering Women RMG Workers Project Bangladesh</div></td><td>334461</td></tr>\n\n\n\n<tr><td>1.</td><td><div>Paribarvittik Jeboboichittra Gram (PJG) Project</div></td><td>334461</td></tr>\n<tr><td>2.</td><td><div>Flood Resistant Shelter for South-West region in Bangladesh (FRESH)</div></td><td>1612124</td></tr>\n<tr><td>3.</td><td><div>Empowering Women RMG Workers Project Bangladesh</div></td><td>313887</td></tr>\n<tr><td>4.</td><td><div>Flood Resistant Shelter for South-West region in Bangladesh (FRESH)</div></td><td>1612124</td></tr>\n<tr><td>5.</td><td><div>Empowering Women RMG Workers Project Bangladesh</div></td><td>334461</td></tr>\n\n\n\n<tr><td>1.</td><td><div>Paribarvittik Jeboboichittra Gram (PJG) Project</div><div style="padding-top:10px;"><img src="art/logo1.png" alt="logo" width="215" height="49"/></div></td><td>2014-01-17</td></tr>\n<tr><td>2.</td><td><div>Flood Resistant Shelter for South-West region in Bangladesh (FRESH)</div><div style="padding-top:10px;"><img src="art/logo2.png" alt="logo" width="215" height="49"/></div></td><td>2014-02-24</td></tr>\n<tr><td>3.</td><td><div>Empowering Women RMG Workers Project Bangladesh</div><div style="padding-top:10px;"><img src="art/logo3.png" alt="logo" width="215" height="49"/></div></td><td>2014-06-07</td></tr>\n<tr><td>4.</td><td><div>Flood Resistant Shelter for South-West region in Bangladesh (FRESH)</div><div style="padding-top:10px;"><img src="art/logo1.png" alt="logo" width="215" height="49"/></div></td><td>2014-11-13</td></tr>\n<tr><td>5.</td><td><div>Empowering Women RMG Workers Project Bangladesh</div><div style="padding-top:10px;"><img src="art/logo2.png" alt="logo" width="215" height="49"/></div></td><td>2015-03-12</td></tr>\n\n\n\n\n<tr><td>1.</td><td><div>Project A</div></td><td>Pakistan</td><td>334461</td></tr>\n<tr><td>2.</td><td><div>Flood Resistant Shelter for South-West region in Bangladesh (FRESH)</div></td><td>Nepal</td><td>1612124</td></tr>\n<tr><td>3.</td><td><div>Project C</div></td><td>Russia</td><td>313887</td></tr>\n<tr><td>4.</td><td><div>Empowering Women RMG Workers Project Bangladesh</div></td><td>China</td><td>1612124</td></tr>\n<tr><td>5.</td><td><div>Project E</div></td><td>Korea</td><td>334461</td></tr>\n\n\n\n',
        ctbox1more: '<div style="width:960px; margin:0 auto;">\n<a href="#ctrack_ending_more" class="boxmore">LOAD MORE</a>\n</div>\n\n\n\n',
        ctboxes: '<div style="width:960px; margin:0 auto;">\n<div style="display:inline-block; vertical-align:top; margin-right:60px;">{ctbox2}{ctbox2table}{ctbox2more}</div><div style="display:inline-block; vertical-align:top;">{ctbox3}{ctbox3table}{ctbox3more}</div>\n</div>\n\n\n\n',
        ctbox2: '<div style="width:444px; margin:0 auto; color:#444; margin-top:40px; border:3px solid #D8D8D8;">\n<div style="width:270px; padding:20px; display:inline-block; vertical-align:top;">{ctend}</div><div style="display:inline-block; vertical-align:top; width:134px; padding-top:40px;"><img src="art/graph.png" alt="Growth Graph" width="84" height="94"/></div>\n</div>\n\n\n\n',
        ctend: '<div style="padding-left:10px; font-size:20px; color:#B19090;">Ended Projects</div>\n<div style="font-size:86px; color:#444;">{finished_projects}</div>\n\n\n\n',
        ctbox2table_data: '<tr><td>{num}.</td><td><div><a href="#ctrack_activity" activity="{activity}">{title}</a></div></td><td>{date}</td></tr>\n',
        ctbox2table: '<table class="box2">\n<tr><td colspan="2" style="font-size:12px; color:#666;">ENDING SOON</td><td style="font-size:12px; color:#666;">END DATE</td></tr>\n{ctbox2table_datas}\n</table>\n',
        ctbox2more: '<div style="width:450px; margin:0 auto;">\n<a href="#ctrack_finished_more" class="boxmore">LOAD MORE</a>\n</div>\n',
        ctbox3more: '<div style="width:450px; margin:0 auto;">\n<a href="#ctrack_starting_more" class="boxmore">LOAD MORE</a>\n</div>\n\n\n',
        ctbox3: '<div style="width:444px; margin:0 auto; color:#444; margin-top:40px; border:3px solid #D8D8D8;">\n<div style="width:270px; padding:20px; display:inline-block; vertical-align:top;">{ctplan}</div><div style="display:inline-block; vertical-align:top; width:134px; padding-top:40px;"><img src="art/graph.png" alt="Growth Graph" width="84" height="94"/></div>\n</div>\n\n\n\n',
        ctplan: '<div style="padding-left:10px; font-size:20px; color:#96B67C;">Planned Projects</div>\n<div style="font-size:86px; color:#444;">{planned_projects}</div>\n\n\n',
        ctbox3table_data: '<tr><td>{num}.</td><td><div><a href="#ctrack_activity" activity="{activity}">{title}</a></div><div style="padding-top:10px;"><img src="art/logo1.png" alt="logo" width="215" height="49"/></div></td><td>{date}</td></tr>\n',
        ctbox3table: '<table class="box3">\n<tr><td colspan="2" style="font-size:12px; color:#666;">STARTING SOON</td><td style="font-size:12px; color:#666;">START DATE</td></tr>\n{ctbox3table_datas}\n</table>\n',
        ctnear: '<div style="width:960px; margin:0 auto; margin-top:60px; background-color:#E5EFFA; padding-bottom:40px;">{ctnearhead}{ctneartable}{ctnearmore}</div>\n\n\n\n',
        ctnearhead: '<div style="width:880px; padding:30px 40px 0 40px; margin:0 auto;">\n<div style="border-bottom:3px solid #CDE2E7; padding-bottom:20px;">\n<div style="display:inline-block; font-size:38px; color:#3C98AF; width:635px;"><div style="display:inline-block; padding-right:10px; width:30px;"><img src="art/compass.png" alt="compass icon" width="30" height="30" /></div>What\'s going on nearby?</div><a href="#" style="display:inline-block; font-size:20px; text-align:right; color:#999;">Change radius of 600 miles</a>\n</div>\n</div>\n\n\n\n',
        ctneartable_data: '<tr><td>{num}.</td><td><div><a href="#ctrack_activity" activity="{activity}">{title}</a></div></td><td>{country}</td><td>{date}</td></tr>\n',
        ctneartable: '<table class="near">\n<tr><td colspan="2" style=" font-size:12px; color:#999; line-height:2.3em;">ACTIVE PROJECTS ENDING SOON</td><td style="font-size:12px; color:#999; line-height:2.3em;">LOCATION &#8743; &#8744;</td><td style="font-size:12px; color:#999; line-height:2.3em;">END DATE</td></tr>\n{ctneartable_datas}\n</table>\n',
        ctnearmore: '<div style="width:880px; margin:0 auto; padding:0 40px;">\n<a href="#ctrack_near_more" class="nearmore">LOAD MORE</a>\n</div>\n\n\n\n',
        ctfooter: '<div style="width:960px; margin:0 auto; margin-top:40px;">{ctfootboxes}</div>\n\n\n\n',
        ctfootboxes: '<div style="display:inline-block; vertical-align:top; width:370px; margin:0 auto;">{ctabout}</div><div style="display:inline-block; vertical-align:top; width:330px; margin:0 auto;">{ctlogo}</div><div style="display:inline-block; vertical-align:top; width:260px; margin:0 auto;">{ctembed}</div>\n\n\n\n',
        ctabout: '<a name="about"></a>\n<div style="width:370px; margin:0 auto; text-align:justify; font-size:18px; color:#777; line-height:1.4em;">The Country Tracker project will build and release a set of tools that can be used by other parties.  It is envisaged that many of these tools will be valuable to data users in terms of querying, pulling, parsing, evaluating and segmenting IATI data.</div>\n\n\n\n',
        ctlogo: '<a href="http://iatistandard.org/" target="_blank" style="width:270; margin:0 auto; padding:0 30px;"><img src="art/iati-logo.png" alt="IATI logo" width="269" height="70"/></a>\n\n\n\n',
        ctembed: '<div style="width:260px; margin:0 auto; font-size:16px; color:#444; padding-bottom:10px;">Embed this on your website!</div>\n<div style="width:198px; height:70px; margin:0 auto; border:1px solid #444; padding:20px 30px; color:#ccc; font-size:14px; resize:both;\noverflow:auto; background-color:rgb(255, 255, 255);">HTML embed code will be placed here for copy and pasting on to your website.</div>\n\n\n\n',
        ctfind: '<div class="footer">\n<div style="width:960px; margin:0 auto;">\n<div style="display:inline-block; vertical-align:top; width:520px; font-size:28px; padding-right:20px;">Find out what\'s going on where you live</div><div style="display:inline-block; vertical-align:top; width:340px; height:35px; background-color:#F7EA61; border-bottom:3px solid #C7B740; font-size:28px; color:#fff;">eg. United Kingdom</div><a href=# style="display:inline-block; vertical-align:top; width:35px; height:35px; padding-left:35px;"><img src="art/find.png" alt="Find" width="35" height="35" /></a>\n</div>\n</div>\n\n\n\n'
    };
    var ctrack = ctrack || exports;
    ctrack.plate = {};
    ctrack.plate.preps = {};
    ctrack.plate.prepare = function(str) {
        if (ctrack.plate.preps[str]) {
            return ctrack.plate.preps[str];
        }
        var aa = str.split("{");
        var ar = [];
        ar.push(aa[0]);
        for (var i = 1; i < aa.length; i++) {
            ar.push("{");
            var av = aa[i].split("}");
            for (var j = 0; j < av.length; j++) {
                ar.push(av[j]);
            }
        }
        ctrack.plate.preps[str] = ar;
        return ar;
    };
    ctrack.plate.lookup = function(str, dat) {
        if (dat[str] != undefined) {
            return dat[str];
        }
        return "{" + str + "}";
    };
    ctrack.plate.chunk = function(str, dat) {
        return ctrack.plate.replace(ctrack.chunks[str], dat);
    };
    ctrack.plate.chunks = function(str, dat) {
        return ctrack.plate.replaces(ctrack.chunks[str], dat);
    };
    ctrack.plate.replace = function(str, dat) {
        var aa = ctrack.plate.prepare(str);
        var r = [];
        for (var i = 0; i < aa.length; i++) {
            var v = aa[i];
            if (v == "{") {
                i++;
                v = aa[i];
                r.push(ctrack.plate.lookup(v, dat));
            } else {
                r.push(v);
            }
        }
        return r.join("");
    };
    ctrack.plate.replaces = function(str, arr) {
        var r = [];
        for (var i = 0; i < arr.length; i++) {
            r.push(ctrack.plate.replace(str, arr[i]));
        }
        return r.join("");
    };
    var ctrack = ctrack || exports;
    ctrack.setup_html = function(args) {
        ctrack.args = args;
        ctrack.div = {};
        ctrack.div.master = $(ctrack.args.master);
        ctrack.div.main = $('<div class="ctrack_main"></div>');
        ctrack.div.master.empty();
        ctrack.div.master.append(ctrack.div.main);
        ctrack.div.main.html(ctrack.plate.chunk("loading", {}));
        var d = {};
        var chunk = function(n, s) {
            if (s != undefined) {
                d[n] = s;
            } else {
                d[n] = ctrack.plate.chunk(n, d);
            }
            return d[n];
        };
        ctrack.htmldata = d;
        ctrack.htmlchunk = chunk;
        ctrack.htmlchunk("ctbox1table_datas", "<tr><td>Loading...</td></tr>");
        ctrack.htmlchunk("active_projects", 0);
        ctrack.htmlchunk("ctbox2table_datas", "<tr><td>Loading...</td></tr>");
        ctrack.htmlchunk("finished_projects", 0);
        ctrack.htmlchunk("ctbox3table_datas", "<tr><td>Loading...</td></tr>");
        ctrack.htmlchunk("planned_projects", 0);
        ctrack.htmlchunk("ctneartable_datas", "<tr><td>Loading...</td></tr>");
        ctrack.htmlchunk("numof_publishers", 0);
        ctrack.htmlchunk("today", ctrack.get_today());
        ctrack.htmlall = function(n) {
            ctrack.htmlchunk("total_projects", d["active_projects"] + d["finished_projects"] + d["planned_projects"]);
            chunk("ctend");
            chunk("ctplan");
            chunk("ctabout");
            chunk("ctlogo");
            chunk("ctembed");
            chunk("ctactive");
            chunk("ctactivities");
            chunk("ctpublishers");
            chunk("ctbox2");
            chunk("ctbox2table");
            chunk("ctbox2more");
            chunk("ctbox3");
            chunk("ctbox3table");
            chunk("ctbox3more");
            chunk("ctbox2more");
            chunk("ctnearhead");
            chunk("ctneartable");
            chunk("ctnearmore");
            chunk("ctfootboxes");
            chunk("ctnav");
            chunk("cthead");
            chunk("ctbox1");
            chunk("ctbox1table");
            chunk("ctbox1more");
            chunk("ctboxes");
            chunk("ctnear");
            chunk("ctfooter");
            chunk("ctfind");
            if (n) {
                return chunk(n);
            }
        };
        ctrack.div.main.html(ctrack.htmlall("bodytest"));
        ctrack.fetch_near = function(args) {
            args = args || {};
            args.limit = args.limit || 5;
            args.country = args.country || "np";
            args.callback = args.callback || function(data) {
                console.log("fetch endingsoon NP ");
                console.log(data);
                var s = [];
                for (i = 0; i < data["iati-activities"].length; i++) {
                    var v = data["iati-activities"][i];
                    v.num = i + 1;
                    v.date = v["end-actual"] || v["end-planned"];
                    v.country = "Nepal";
                    v.activity = v["iati-identifier"];
                    s.push(ctrack.plate.chunk("ctneartable_data", v));
                }
                ctrack.htmlchunk("ctneartable_datas", s.join(""));
                ctrack.div.main.html(ctrack.htmlall("bodytest"));
            };
            ctrack.fetch_endingsoon(args);
        };
        ctrack.fetch_endingsoon({
            limit: 5
        });
        ctrack.fetch_finished({
            limit: 5
        });
        ctrack.fetch_planned({
            limit: 5
        });
        ctrack.fetch_near({
            limit: 5
        });
        $(document).on("click", "a", function(event) {
            var s = $(this).prop("href");
            if (s) {
                s = s.split("#");
                if (s[1]) {
                    s = s[1];
                    var aa = s.split("_");
                    console.log(s);
                    if (aa[0] == "ctrack") {
                        event.preventDefault();
                        if (aa[1] == "index") {
                            ctrack.div.main.html(ctrack.htmlall("bodytest"));
                        } else if (aa[1] == "activity") {
                            var s = $(this).attr("activity");
                            console.log(s);
                            ctrack.fetch_activity({
                                activity: s
                            });
                        } else if (aa[2] == "more") {
                            switch (aa[1]) {
                              case "ending":
                                ctrack.fetch_endingsoon({
                                    limit: 20
                                });
                                break;

                              case "finished":
                                ctrack.fetch_finished({
                                    limit: 20
                                });
                                break;

                              case "starting":
                                ctrack.fetch_planned({
                                    limit: 20
                                });
                                break;

                              case "near":
                                ctrack.fetch_near({
                                    limit: 20
                                });
                                break;
                            }
                        }
                    }
                }
            }
        });
    };
    var ctrack = ctrack || exports;
    ctrack.iati = {};
    ctrack.iati.totext = function(v) {
        if (typeof v == "string") {
            return v;
        } else if (typeof v == "object") {
            return ctrack.iati.totext(v.text);
        }
        return "";
    };
    ctrack.iati.fill_text = function(vi, vo, ss) {
        for (var i = 0; i < ss.length; i++) {
            vo[ss[i]] = ctrack.iati.totext(vi[ss[i]]);
        }
    };
    ctrack.iati.array_status = [ "Pipeline", "Implementation", "Completion", "Post", "Cancelled" ];
    ctrack.iati.lookup_status = function(n) {
        return ctrack.iati.array_status[n] || "N/A";
    };
    ctrack.iati.clean_activity = function(dirtyact) {
        var act = {};
        if (dirtyact["iati-activity"]) {
            dirtyact = dirtyact["iati-activity"];
        }
        ctrack.iati.fill_text(dirtyact, act, [ "title", "description", "reporting-org" ]);
        act["status-code"] = Number(dirtyact["activity-status"] && dirtyact["activity-status"].code || -1);
        act["status"] = ctrack.iati.lookup_status(act["status-code"]);
        act["start-date"] = dirtyact["start-actual"] || dirtyact["start-planned"];
        act["end-date"] = dirtyact["end-actual"] || dirtyact["end-planned"];
        act.id = dirtyact["iati-identifier"];
        return act;
    };
    ctrack.iati.clean_activities = function(dirtyacts) {
        var acts = [];
        for (var i = 0; i < dirtyacts.length; i++) {
            acts[i] = ctrack.iati.clean_activity(dirtyacts[i]);
        }
        return acts;
    };
    var ctrack = ctrack || exports;
    ctrack.get_today = function() {
        var now = new Date();
        var day = ("0" + now.getDate()).slice(-2);
        var month = ("0" + (now.getMonth() + 1)).slice(-2);
        var today = now.getFullYear() + "-" + month + "-" + day;
        return "2013-01-01";
    };
    ctrack.fetch_endingsoon = function(args) {
        args = args || {};
        var today = ctrack.get_today();
        var api = "/api/1/access/activity.db.json";
        var dat = {
            limit: args.limit || 5,
            "end-date__sort": "asc",
            "end-date__gt": today,
            "recipient-country": args.country || ctrack.args.country
        };
        var callback = args.callback || function(data) {
            console.log("fetch endingsoon : " + today);
            console.log(data);
            var s = [];
            for (i = 0; i < data["iati-activities"].length; i++) {
                var v = data["iati-activities"][i];
                v.num = i + 1;
                v.date = v["end-actual"] || v["end-planned"];
                v.activity = v["iati-identifier"];
                s.push(ctrack.plate.chunk("ctbox1table_data", v));
            }
            ctrack.htmlchunk("active_projects", data["total-count"]);
            ctrack.htmlchunk("ctbox1table_datas", s.join(""));
            ctrack.div.main.html(ctrack.htmlall("bodytest"));
        };
        $.ajax({
            dataType: "json",
            url: ctrack.args.datastore + api + "?callback=?",
            data: dat,
            success: callback
        });
    };
    ctrack.fetch_finished = function(args) {
        args = args || {};
        var today = ctrack.get_today();
        var api = "/api/1/access/activity.db.json";
        var dat = {
            limit: args.limit || 5,
            "end-date__sort": "desc",
            "end-date__lt": today,
            "recipient-country": args.country || ctrack.args.country
        };
        var callback = args.callback || function(data) {
            console.log("fetch finshed : " + today);
            console.log(data);
            var s = [];
            for (i = 0; i < data["iati-activities"].length; i++) {
                var v = data["iati-activities"][i];
                v.num = i + 1;
                v.date = v["end-actual"] || v["end-planned"];
                v.activity = v["iati-identifier"];
                s.push(ctrack.plate.chunk("ctbox2table_data", v));
            }
            ctrack.htmlchunk("finished_projects", data["total-count"]);
            ctrack.htmlchunk("ctbox2table_datas", s.join(""));
            ctrack.div.main.html(ctrack.htmlall("bodytest"));
        };
        $.ajax({
            dataType: "json",
            url: ctrack.args.datastore + api + "?callback=?",
            data: dat,
            success: callback
        });
    };
    ctrack.fetch_planned = function(args) {
        args = args || {};
        var today = ctrack.get_today();
        var api = "/api/1/access/activity.db.json";
        var dat = {
            limit: args.limit || 5,
            "start-date__sort": "asc",
            "start-date__gt": today,
            "recipient-country": args.country || ctrack.args.country
        };
        var callback = args.callback || function(data) {
            console.log("fetch planned : " + today);
            console.log(data);
            var s = [];
            for (i = 0; i < data["iati-activities"].length; i++) {
                var v = data["iati-activities"][i];
                v.num = i + 1;
                v.date = v["start-actual"] || v["start-planned"];
                v.activity = v["iati-identifier"];
                s.push(ctrack.plate.chunk("ctbox3table_data", v));
            }
            ctrack.htmlchunk("planned_projects", data["total-count"]);
            ctrack.htmlchunk("ctbox3table_datas", s.join(""));
            ctrack.div.main.html(ctrack.htmlall("bodytest"));
        };
        $.ajax({
            dataType: "json",
            url: ctrack.args.datastore + api + "?callback=?",
            data: dat,
            success: callback
        });
    };
    ctrack.fetch_stats = function(args) {
        args = args || {};
        var today = ctrack.get_today();
        var api = "/api/1/access/activity.stats.json";
        var dat = {
            limit: 1e4,
            "recipient-country": args.country || ctrack.args.country
        };
        var callback = args.callback || function(data) {
            console.log("activity stats");
            console.log(data);
            ctrack.htmlchunk("numof_publishers", data["counts"]["reporting_org_id"]);
            ctrack.div.main.html(ctrack.htmlall("bodytest"));
        };
        $.ajax({
            dataType: "json",
            url: ctrack.args.datastore + api + "?callback=?",
            data: dat,
            success: callback
        });
    };
    ctrack.fetch_activity = function(args) {
        var api = "/api/1/access/activity.db.json";
        var dat = {
            "iati-identifier": args.activity
        };
        var callback = function(data) {
            ctrack.div.main.html(ctrack.plate.chunk("preparing", {}));
            console.log(data);
            var acts = ctrack.iati.clean_activities(data["iati-activities"]);
            console.log(acts);
            ctrack.div.main.html(ctrack.plate.chunks("dump_act", acts));
        };
        $.ajax({
            dataType: "json",
            url: ctrack.args.datastore + api + "?callback=?",
            data: dat,
            success: callback
        });
    };
})({}, function() {
    return this;
}());