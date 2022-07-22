const e = Symbol("Comlink.proxy"),
  t = Symbol("Comlink.endpoint"),
  o = Symbol("Comlink.releaseProxy"),
  n = Symbol("Comlink.thrown"),
  r = e => ("object" == typeof e && null !== e) || "function" == typeof e,
  s = new Map([
    [
      "proxy",
      {
        canHandle: t => r(t) && t[e],
        serialize(e) {
          const { port1: t, port2: o } = new MessageChannel();
          return a(e, t), [o, [o]];
        },
        deserialize(e) {
          return e.start(), c(e, [], t);
          var t;
        },
      },
    ],
    [
      "throw",
      {
        canHandle: e => r(e) && n in e,
        serialize({ value: e }) {
          let t;
          return (
            (t =
              e instanceof Error
                ? {
                    isError: !0,
                    value: { message: e.message, name: e.name, stack: e.stack },
                  }
                : { isError: !1, value: e }),
            [t, []]
          );
        },
        deserialize(e) {
          if (e.isError)
            throw Object.assign(new Error(e.value.message), e.value);
          throw e.value;
        },
      },
    ],
  ]);
function a(t, o = self) {
  o.addEventListener("message", function r(s) {
    if (!s || !s.data) return;
    const { id: l, type: c, path: u } = Object.assign({ path: [] }, s.data),
      g = (s.data.argumentList || []).map(m);
    let p;
    try {
      const o = u.slice(0, -1).reduce((e, t) => e[t], t),
        n = u.reduce((e, t) => e[t], t);
      switch (c) {
        case "GET":
          p = n;
          break;
        case "SET":
          (o[u.slice(-1)[0]] = m(s.data.value)), (p = !0);
          break;
        case "APPLY":
          p = n.apply(o, g);
          break;
        case "CONSTRUCT":
          p = (function(t) {
            return Object.assign(t, { [e]: !0 });
          })(new n(...g));
          break;
        case "ENDPOINT":
          {
            const { port1: e, port2: o } = new MessageChannel();
            a(t, o),
              (p = (function(e, t) {
                return d.set(e, t), e;
              })(e, [e]));
          }
          break;
        case "RELEASE":
          p = void 0;
          break;
        default:
          return;
      }
    } catch (e) {
      p = { value: e, [n]: 0 };
    }
    Promise.resolve(p)
      .catch(e => ({ value: e, [n]: 0 }))
      .then(e => {
        const [t, n] = f(e);
        o.postMessage(Object.assign(Object.assign({}, t), { id: l }), n),
          "RELEASE" === c && (o.removeEventListener("message", r), i(o));
      });
  }),
    o.start && o.start();
}
function i(e) {
  (function(e) {
    return "MessagePort" === e.constructor.name;
  })(e) && e.close();
}
function l(e) {
  if (e) throw new Error("Proxy has been released and is not useable");
}
function c(e, n = [], r = function() {}) {
  let s = !1;
  const a = new Proxy(r, {
    get(t, r) {
      if ((l(s), r === o))
        return () =>
          g(e, { type: "RELEASE", path: n.map(e => e.toString()) }).then(() => {
            i(e), (s = !0);
          });
      if ("then" === r) {
        if (0 === n.length) return { then: () => a };
        const t = g(e, { type: "GET", path: n.map(e => e.toString()) }).then(m);
        return t.then.bind(t);
      }
      return c(e, [...n, r]);
    },
    set(t, o, r) {
      l(s);
      const [a, i] = f(r);
      return g(
        e,
        { type: "SET", path: [...n, o].map(e => e.toString()), value: a },
        i,
      ).then(m);
    },
    apply(o, r, a) {
      l(s);
      const i = n[n.length - 1];
      if (i === t) return g(e, { type: "ENDPOINT" }).then(m);
      if ("bind" === i) return c(e, n.slice(0, -1));
      const [d, f] = u(a);
      return g(
        e,
        { type: "APPLY", path: n.map(e => e.toString()), argumentList: d },
        f,
      ).then(m);
    },
    construct(t, o) {
      l(s);
      const [r, a] = u(o);
      return g(
        e,
        { type: "CONSTRUCT", path: n.map(e => e.toString()), argumentList: r },
        a,
      ).then(m);
    },
  });
  return a;
}
function u(e) {
  const t = e.map(f);
  return [
    t.map(e => e[0]),
    ((o = t.map(e => e[1])), Array.prototype.concat.apply([], o)),
  ];
  var o;
}
const d = new WeakMap();
function f(e) {
  for (const [t, o] of s)
    if (o.canHandle(e)) {
      const [n, r] = o.serialize(e);
      return [{ type: "HANDLER", name: t, value: n }, r];
    }
  return [{ type: "RAW", value: e }, d.get(e) || []];
}
function m(e) {
  switch (e.type) {
    case "HANDLER":
      return s.get(e.name).deserialize(e.value);
    case "RAW":
      return e.value;
  }
}
function g(e, t, o) {
  return new Promise(n => {
    const r = new Array(4)
      .fill(0)
      .map(() =>
        Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16),
      )
      .join("-");
    e.addEventListener("message", function t(o) {
      o.data &&
        o.data.id &&
        o.data.id === r &&
        (e.removeEventListener("message", t), n(o.data));
    }),
      e.start && e.start(),
      e.postMessage(Object.assign({ id: r }, t), o);
  });
}
const p = {
  tools: [],
  config: {},
  files: [],
  fs: {},
  async init() {
    if (p.tools.length < 2) throw "Expecting at least 1 tool.";
    const e = p.tools[0];
    return (
      await this._setup(e, !0),
      e.module.FS.mkdir(p.config.dirData, 511),
      e.module.FS.mkdir(p.config.dirMounted, 511),
      e.module.FS.chdir(p.config.dirData),
      (p.fs = e.module.FS),
      "lazy" == p.tools[1].loading && (p.tools[1].loading = "eager"),
      await this._initModules(),
      p._log("Ready"),
      !0
    );
  },
  async _initModules() {
    await this._setup(p.tools[1]),
      await Promise.all(p.tools.slice(2).map(e => this._setup(e))),
      await this._setupFS();
  },
  mount(e) {
    const t = p.config.dirData,
      o = p.config.dirShared,
      n = p.config.dirMounted;
    let r = [],
      s = [];
    (e?.length && "string" != typeof e) || (e = [e]),
      p._log(`Mounting ${e.length} files`);
    for (let o of e)
      if (o instanceof File || (o?.data instanceof Blob && o.name))
        r.push(o), s.push(o.name);
      else {
        if ("string" != typeof o || !o.startsWith("http"))
          throw "Cannot mount file(s) specified. Must be a File, Blob, or a URL string.";
        {
          const e = o
            .split("//")
            .pop()
            .replace(/\//g, "-");
          p.fs.createLazyFile(t, e, o, !0, !0), s.push(e);
        }
      }
    try {
      p.fs.unmount(n);
    } catch (e) {}
    return (
      (p.files = p.files.concat(r)),
      p.fs.mount(
        p.tools[0].module.WORKERFS,
        {
          files: p.files.filter(e => e instanceof File),
          blobs: p.files.filter(e => e?.data instanceof Blob),
        },
        n,
      ),
      r.map(e => {
        const r = `${o}${n}/${e.name}`,
          s = `${o}${t}/${e.name}`;
        try {
          p.tools[1].module.FS.unlink(s);
        } catch (e) {}
        p._log(`Creating symlink: ${s} --\x3e ${r}`),
          p.tools[1].module.FS.symlink(r, s);
      }),
      s.map(e => `${o}${t}/${e}`)
    );
  },
  async exec(e, t = null) {
    if (
      (p._log(
        `Executing %c${e}%c args=${t}`,
        "color:darkblue; font-weight:bold",
        "",
      ),
      !e)
    )
      throw "Expecting a command";
    let o = e;
    null == t && ((t = e.split(" ")), (o = t.shift()));
    const n = p.tools.filter(e => {
      let t = o;
      return (
        !1 === e?.features?.simd && (t = `${t}-nosimd`),
        !1 === e?.features?.threads && (t = `${t}-nothreads`),
        e.program == t
      );
    });
    if (0 == n.length) throw `Program ${o} not found.`;
    const r = n[0];
    (r.stdout = ""),
      (r.stderr = ""),
      "lazy" == r.loading && ((r.loading = "eager"), await this._initModules());
    try {
      r.module.callMain(t);
    } catch (e) {
      console.error(e);
    }
    try {
      r.module.FS.close(r.module.FS.streams[1]),
        r.module.FS.close(r.module.FS.streams[2]);
    } catch (e) {}
    (r.module.FS.streams[1] = r.module.FS.open("/dev/stdout", "w")),
      (r.module.FS.streams[2] = r.module.FS.open("/dev/stderr", "w"));
    let s = { stdout: r.stdout, stderr: r.stderr };
    if ((p.config.printInterleaved && (s = r.stdout), !0 === r.reinit)) {
      const e = r.module.FS.cwd();
      Object.assign(r, r.config),
        (r.ready = !1),
        await this._setup(r),
        await this._setupFS(),
        await this.cd(e);
    }
    return s;
  },
  cat: e => p._fileop("cat", e),
  ls: e => p._fileop("ls", e),
  download: e => p._fileop("download", e),
  cd(e) {
    for (let t = 1; t < p.tools.length; t++) {
      p.tools[t].module && p.tools[t].module.FS.chdir(e);
    }
  },
  mkdir: e => (p.tools[1].module.FS.mkdir(e), !0),
  async _setup(e, t = !1) {
    if (!e.ready) {
      if (
        ((e.config = Object.assign({}, e)),
        e.urlPrefix ||
          (e.urlPrefix = `${p.config.urlCDN}/${e.tool}/${e.version}`),
        e.program || (e.program = e.tool),
        !t && !e.features)
      ) {
        e.features = {};
        const t = await fetch(`${e.urlPrefix}/config.json`).then(e => e.json());
        t["wasm-features"]?.includes("simd") &&
          !(await (async () =>
            WebAssembly.validate(
              new Uint8Array([
                0,
                97,
                115,
                109,
                1,
                0,
                0,
                0,
                1,
                5,
                1,
                96,
                0,
                1,
                123,
                3,
                2,
                1,
                0,
                10,
                10,
                1,
                8,
                0,
                65,
                0,
                253,
                15,
                253,
                98,
                11,
              ]),
            ))()) &&
          (console.warn(
            `[biowasm] SIMD is not supported in this browser. Loading slower non-SIMD version of ${e.program}.`,
          ),
          (e.program += "-nosimd"),
          (e.features.simd = !1)),
          t["wasm-features"]?.includes("threads") &&
            !(await (async e => {
              try {
                return (
                  "undefined" != typeof MessageChannel &&
                    new MessageChannel().port1.postMessage(
                      new SharedArrayBuffer(1),
                    ),
                  WebAssembly.validate(e)
                );
              } catch (e) {
                return !1;
              }
            })(
              new Uint8Array([
                0,
                97,
                115,
                109,
                1,
                0,
                0,
                0,
                1,
                4,
                1,
                96,
                0,
                0,
                3,
                2,
                1,
                0,
                5,
                4,
                1,
                3,
                1,
                1,
                10,
                11,
                1,
                9,
                0,
                65,
                0,
                254,
                16,
                2,
                0,
                26,
                11,
              ]),
            )) &&
            (console.warn(
              `[biowasm] Threads are not supported in this browser. Loading slower non-threaded version of ${e.program}.`,
            ),
            (e.program += "-nothreads"),
            (e.features.threads = !1));
      }
      if ("lazy" != e.loading) {
        if (
          (self.importScripts(`${e.urlPrefix}/${e.program}.js`),
          (e.module = await Module({
            thisProgram: e.program,
            locateFile: (t, o) => `${e.urlPrefix}/${t}`,
            print: t => (e.stdout += `${t}\n`),
            printErr: p.config.printInterleaved
              ? t => (e.stdout += `${t}\n`)
              : t => (e.stderr += `${t}\n`),
          })),
          !t)
        ) {
          const t = e.module.FS;
          t.mkdir(p.config.dirShared),
            t.mount(
              e.module.PROXYFS,
              { root: "/", fs: p.fs },
              p.config.dirShared,
            ),
            p.tools[1] == e
              ? t.chdir(`${p.config.dirShared}${p.config.dirData}`)
              : t.chdir(p.tools[1].module.FS.cwd());
        }
        (e.stdout = ""), (e.stderr = ""), (e.ready = !0);
      }
    }
  },
  async _setupFS() {
    for (let e in p.tools)
      if (0 != e && "lazy" != p.tools[e].loading)
        for (let t in p.tools) {
          if (0 == t || e == t || "lazy" == p.tools[t].loading) continue;
          const o = p.tools[e].module.FS,
            n = p.tools[t].module.FS,
            r = `/${p.tools[e].tool}`;
          o.analyzePath(r).exists &&
            !n.analyzePath(r).exists &&
            (p._log(`Mounting ${r} onto ${p.tools[t].tool} filesystem`),
            n.mkdir(r),
            n.mount(p.tools[0].module.PROXYFS, { root: r, fs: o }, r));
        }
  },
  _fileop(e, t) {
    p._log(`Running ${e} ${t}`);
    const o = p.tools[1].module.FS,
      n = o.analyzePath(t);
    if (!n.exists) return p._log(`File ${t} not found.`), !1;
    switch (e) {
      case "cat":
        return o.readFile(t, { encoding: "utf8" });
      case "ls":
        return o.isFile(n.object.mode) ? o.stat(t) : o.readdir(t);
      case "download":
        const e = new Blob([this.cat(t)]);
        return URL.createObjectURL(e);
    }
    return !1;
  },
  _log(e) {
    if (!p.config.debug) return;
    let t = [...arguments];
    t.shift(),
      console.log(`%c[WebWorker]%c ${e}`, "font-weight:bold", "", ...t);
  },
};
a(p);
