'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var main = {};

var _a, _b, _c;
/** Is game running in single room simulation */
const IS_SIM = !!Game.rooms.sim;
/** Is game running on the official server */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const IS_MMO = !!((_b = (_a = Game.shard) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.startsWith("shard"));
/** The name of the account running the code  */
const PLAYER_USERNAME = (Object.values(Game.spawns)[0] ||
    ((_c = Object.values(Game.rooms).find((r) => { var _a; return (_a = r.controller) === null || _a === void 0 ? void 0 : _a.my; })) === null || _c === void 0 ? void 0 : _c.controller) ||
    Object.values(Game.creeps)[0]).owner.username;
/** username for the Invader NPCs */
const INVADER_USERNAME = "Invader";
/** username for Source Keeper NPCs */
const SOURCE_KEEPER_USERNAME = "Source Keeper";
/** username for the Caravan NPCs & unclaimed ruins */
const CARAVAN_USERNAME = "Screeps";
/** An array of all minerals */
const MINERALS_ALL = Object.keys(MINERAL_MIN_AMOUNT);
/** An array of all lab's mineral compounds */
const COMPOUNDS_ALL = Object.keys(REACTION_TIME);
/** A map of {@link ScreepsReturnCode} to their string names */
const RETURN_CODES = {
    [OK]: "Ok",
    [ERR_NOT_OWNER]: "Error: Not owner",
    [ERR_NO_PATH]: "Error: No path",
    [ERR_BUSY]: "Error: Busy",
    [ERR_NAME_EXISTS]: "Error: Name exists",
    [ERR_NOT_FOUND]: "Error: Not found",
    [ERR_NOT_ENOUGH_RESOURCES]: "Error: Not enough resources",
    [ERR_INVALID_TARGET]: "Error: Invalid target",
    [ERR_FULL]: "Error: Full",
    [ERR_NOT_IN_RANGE]: "Error: Not in range",
    [ERR_INVALID_ARGS]: "Error: Invalid args",
    [ERR_TIRED]: "Error: Tired",
    [ERR_NO_BODYPART]: "Error: No bodypart",
    [ERR_RCL_NOT_ENOUGH]: "Error: Not enough RCL",
    [ERR_GCL_NOT_ENOUGH]: "Error: Not enough GCL",
};

/**
 * Like `return map[key] ??= fallback(key)` but for {@link Map}.
 * @param map the target map
 * @param key element key
 * @param fallback default element value
 * @returns existing value or fallback
 */
function getOrSetMap(map, key, fallback) {
    if (!map.has(key))
        map.set(key, fallback(key));
    return map.get(key);
}
/**
 * Like `key => map[key] || fallback()` but for {@link Map}.
 * @param map the target map
 * @param fallback value if missing in the map
 * @returns a getter into the map
 */
function getMapWithDefault(map, fallback) {
    return (key) => (map.has(key) ? map.get(key) : fallback());
}
/**
 * Create a new {@link Dict}
 * @returns an empty dict
 */
function newDict() {
    return {};
}
/**
 * Iterate over {@link Dict} entries
 * @param d target dict
 * @returns array of key value pairs
 */
function iterDict(d) {
    return Object.entries(d);
}
/**
 * Like `d[k] = v` but delete the key if {@link v} is undefined.
 * @param d target dict
 * @param k key to set
 * @param v value to set
 * @returns the value
 */
function setOrDelete(d, k, v) {
    if (v !== undefined)
        d[k] = v;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    else
        delete d[k];
    return v;
}

/**
 * Convert a number to string in SI decimal notation.
 * @param num number to format
 * @param digits number of digits after the decimal point
 * @returns formatted string
 * @example 123k or 12.34G
 */
function formatSI(num, digits = 2) {
    const si = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let i;
    for (i = si.length - 1; i > 0; i--) {
        if (num >= si[i].value) {
            break;
        }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}
/**
 * Generate a pseudorandom number between {@link min} min inclusive and {@link max} exclusive.
 * @param min inclusive minimum
 * @param max exclusive maximum
 * @param floor round to int
 * @returns a pseudorandom number
 */
function random(min, max, floor) {
    const v = Math.random() * (max - min) + min;
    return floor ? Math.floor(v) : v;
}
/**
 * Clamp a number between {@link min} and {@link max} inclusive.
 * @param min inclusive minimum
 * @param val value to clamp
 * @param max inclusive maximum
 * @returns clamped value
 */
function clamp(min, val, max) {
    if (val < min)
        return min;
    if (val > max)
        return max;
    return val;
}
function mix(a, b, ratio) {
    return a * ratio + b * (1 - ratio);
}
/**
 * Compute a moving average
 * @param prev previous average
 * @param life average sample count
 * @param cur current value
 * @returns current average
 */
function movingAverage(prev, life, cur) {
    if (prev == undefined)
        return cur;
    const alpha = 2 / (life + 1);
    return mix(cur, prev, alpha);
}
/**
 * Round a number to the nearest multiple
 * @param value value to round
 * @param multiple multiple to round to
 * @returns rounded value
 */
function round(value, multiple) {
    return Math.round(value / multiple) * multiple;
}

/**
 * Calls the specified callback function for all the elements in a list.
 * The return value of the callback function is the accumulated result,
 * and is provided as an argument in the next call to the callback function.
 * `ts.reduce` But also works with generators.
 * @param ts list of things
 * @param acc function to accumulate a thing to
 * @param initial accumulator start value
 * @returns the accumulated total
 */
function reduce(ts, acc, initial) {
    let v = initial;
    for (const t of ts)
        v = acc(v, t);
    return v;
}
/** Data-last version of {@link reduce} */
const reduce_ = partial(reduce);
/**
 * Compute the sum of a list of things.
 * ```ts
 * ts.reduce((acc, t) => acc + map(t), 0)
 * ```
 * But also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to number
 * @returns the total sum
 */
function sum(ts, map) {
    let v = 0;
    for (const t of ts)
        v += map(t);
    return v;
}
/** Data-last version of {@link sum} */
const sum_ = partial1(sum);
/**
 * Compute the average of a list of things.
 * ```ts
 * ts.reduce((acc, t) => acc + map(t), 0) / ts.length
 * ```
 * But also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to number
 * @returns the average or 0 if ts is empty
 */
function avg(ts, map) {
    let count = 0;
    let v = 0;
    for (const t of ts) {
        count += 1;
        v += map(t);
    }
    return count ? v / count : 0;
}
/** Data-last version of {@link avg} */
const avg_ = partial1(avg);
/**
 * Count values of a list of things also works with generators.
 * @param ts list of things
 * @param pred optional: function to check if thing is valid
 * @returns the number of valid things
 */
function count(ts, pred = exists) {
    return sum(ts, (t) => (pred(t) ? 1 : 0));
}
/** Data-last version of {@link count} */
const count_ = partial1(count);
/**
 * Check the value is not undefined
 * @param t value to check
 * @returns is not undefined
 */
function exists(t) {
    return t !== undefined;
}
/**
 * Find the thing of a list with the biggest value also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to number
 * @param minE optional: exclusive minimum value to accept
 * @returns the thing will the biggest value or undefined if none are superior to {@link minE}
 */
function max(ts, map, minE = Number.NEGATIVE_INFINITY) {
    let res = undefined;
    for (const t of ts) {
        const v = map(t);
        if (v > minE) {
            minE = v;
            res = t;
        }
    }
    return res;
}
/** Data-last version of {@link max} */
const max_ = partial(max);
/**
 * Find the thing of a list with the lowest value also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to number
 * @param maxE optional: exclusive maximum value to accept
 * @returns the thing will the lowest value or undefined if none are inferior to {@link maxE}
 */
function min(ts, map, maxE = Number.POSITIVE_INFINITY) {
    return max(ts, (t) => -map(t), -maxE);
}
/** Data-last version of {@link min} */
const min_ = partial(min);
/**
 * Find the biggest value in a list of things also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to number
 * @param minE optional: exclusive minimum value to accept
 * @returns the biggest value and the associated thing or undefined if none are superior to {@link minE}
 */
function maxEntry(ts, map, minE = Number.NEGATIVE_INFINITY) {
    let res = undefined;
    for (const t of ts) {
        const v = map(t);
        if (v > minE) {
            minE = v;
            res = t;
        }
    }
    return res ? { t: res, value: minE } : undefined;
}
/**
 * Find the lowest value in a list of things also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to number
 * @param maxE optional: exclusive maximum value to accept
 * @returns the lowest value and the associated thing or undefined if none are superior to {@link minE}
 */
function minEntry(ts, map, maxE = Number.POSITIVE_INFINITY) {
    const e = maxEntry(ts, (t) => -map(t), -maxE);
    if (e)
        e.value *= -1;
    return e;
}
/**
 * Calls a defined callback function on each element of a list.
 * ```ts
 * ts.map(map)
 * ```
 * But also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to something
 * @yields each mapped thing
 */
function* map(ts, map) {
    for (const t of ts) {
        yield map(t);
    }
}
/** Data-last version of {@link map} */
const map_ = partial1(map);
/**
 * Calls a defined callback function on each element of a list.
 * ```ts
 * ts.forEach(map)
 * ```
 * But also works with generators.
 * @param ts list of things
 * @param act function to do something with a thing
 */
function forEach(ts, act) {
    for (const t of ts)
        act(t);
}
/** Data-last version of {@link forEach} */
const forEach_ = partial1(forEach);
/**
 * Returns individual elements of each sub-array also works with generators.
 * @param tts nested list of things
 * @yields each individual thing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* flatten(...tts) {
    for (const ts of tts)
        yield* ts;
}
/**
 * Calls a defined callback function on each element of a list then returns individual elements also works with generators.
 * @param ts list of things
 * @param map function to convert a thing to a list of something else
 * @yields each individual mapped thing
 */
function* flatMap(ts, map) {
    for (const t of ts)
        yield* map(t);
}
/** Data-last version of {@link flatMap} */
const flatMap_ = partial1(flatMap);
/** Empty generator */
function* none() {
    /* */
}
/**
 * Returns the elements of an array that meet the condition specified in a callback function.
 * ```ts
 * ts.filter(pred)
 * ```
 * But also works with generators.
 * @param ts list of things
 * @param pred function to check if thing is valid
 * @yields each valid thing
 */
function* filter(ts, pred) {
    for (const t of ts) {
        if (pred(t))
            yield t;
    }
}
/** Data-last version of {@link filter} */
const filter_ = partial1(filter);
/**
 * Returns the elements of an array that meet the condition specified in a callback function.
 * ```ts
 * ts.filter(pred)
 * ```
 * But also works with generators.
 * @param ts list of things
 * @param pred function to check if thing is valid
 * @yields each valid thing
 */
function* filterIs(ts, pred) {
    for (const t of ts) {
        if (pred(t))
            yield t;
    }
}
/** Data-last version of {@link filterIs} */
const filterIs_ = partial1(filterIs);
/**
 * Returns the first thing which is valid.
 * @param ts list of things
 * @param pred function to check if a thing is valid
 * @returns a thing or undefined if none are valid
 */
function first(ts, pred = exists) {
    for (const t of ts) {
        if (pred(t))
            return t;
    }
    return undefined;
}
/** Data-last version of {@link first} */
const first_ = partial1(first);
/**
 * Returns if any of the thing is valid.
 * @param ts list of things
 * @param pred function to check if a thing is valid
 * @returns if any is valid
 */
function some(ts, pred = exists) {
    for (const t of ts) {
        if (pred(t))
            return true;
    }
    return false;
}
/**
 * Returns if all the things are valid.
 * @param ts list of things
 * @param pred function to check if a thing is valid
 * @returns if all are valid
 */
function every(ts, pred = exists) {
    for (const t of ts) {
        if (!pred(t))
            return false;
    }
    return true;
}
/**
 * Returns the first thing which is valid.
 * @param ts list of things
 * @param pred function to check if a thing is valid
 * @returns a thing or undefined if none are valid
 */
function firstIs(ts, pred) {
    for (const t of ts) {
        if (pred(t))
            return t;
    }
    return undefined;
}
/** Data-last version of {@link firstIs} */
const firstIs_ = partial1(firstIs);
const collect = Array.from;
/**
 * Filter an array without allocating a new one.
 * @param ts an array of things
 * @param pred function to check if a thing is valid
 * @returns same array with only valid things
 */
function filterInPlace(ts, pred) {
    let j = 0;
    ts.forEach((e, i) => {
        if (pred(e)) {
            if (i !== j)
                ts[j] = e;
            j++;
        }
    });
    ts.length = j;
    return ts;
}
/** Data-last version of {@link filterInPlace} */
const filterInPlace_ = partial1(filterInPlace);
/**
 * Create a map aka dictionary from a list.
 * @param ts list of things
 * @param key function to get the key from a thing
 * @returns a map of keys and arrays of values
 */
function groupBy(ts, key) {
    const map = new Map();
    for (const t of ts) {
        getOrSetMap(map, key(t), () => []).push(t);
    }
    return map;
}
/** Data-last version of {@link groupBy} */
const groupBy_ = partial1(groupBy);
/**
 * Select a random element in an array with uniform distribution.
 * @param ts an array of elements
 * @returns an element or undefined if array is empty
 */
function randomPick(ts) {
    return ts.length ? ts[Math.floor(Math.random() * ts.length)] : undefined;
}
/**
 * Select a random element in an array with a custom distribution.
 * @param ts an array of elements
 * @param weight function returning the relative probability of each element
 * @returns an element or undefined if array is empty
 */
function weightedRandomPick(ts, weight) {
    let w = Math.random() * sum(ts, weight);
    for (const t of ts) {
        w -= weight(t);
        if (w < 0)
            return t;
    }
    return undefined;
}
/** Data-last version of {@link weightedRandomPick} */
const weightedRandomPick_ = partial1(weightedRandomPick);
/**
 * Sorts an array in place by score ascending.
 * @param ts an array of things
 * @param score function to convert a thing to it's score
 * @returns the sorted array
 */
function sort(ts, score) {
    return ts.sort((a, b) => score(a) - score(b));
}
/** Data-last version of {@link sort} */
const sort_ = partial1(sort);
/**
 * Perform left-to-right function composition.
 * @param v The initial value.
 * @param fns the list of unary functions to apply.
 * @returns `fns.reduce((acc, fn) => fn(acc), t)` with valid types.
 * @example
 * pipe(
 *   [1, 2, 3, 4],
 *   map._(x => x * 2),
 *   arr => [arr[0] + arr[1], arr[2] + arr[3]],
 * ) // => [6, 14]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pipe(v, ...fns) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    return fns.reduce((acc, fn) => fn(acc), v);
}
/**
 * Convert data-first function to data-last.
 * @param fn a data-first function
 * @returns a data-last function
 * @example
 * const powE = partial(Math.pow)(Math.E)
 * powE(42) === Math.pow(42, Math.E)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function partial(fn) {
    return (...ps) => (t) => fn(t, ...ps);
}
function partial1(fn) {
    return (p) => (t) => fn(t, p);
}
/**
 * Reorder an array in place. Uses the Fisher-Yates shuffle algorithm.
 * @param ts an array of things
 * @returns the shuffled array
 */
function shuffle(ts) {
    for (let m = ts.length - 1; m; m--) {
        const i = Math.floor(Math.random() * m);
        const t = ts[m];
        ts[m] = ts[i];
        ts[i] = t;
    }
    return ts;
}

const Invalid = {};
/**
 * Check is {@link v} is not {@link Invalid}.
 * @param v thing to check
 * @returns whether v is found or not
 */
function isValid(v) {
    return v !== Invalid;
}
/**
 * Wrap {@link fn} with a cache indexed by {@link K}.
 * @example sort(ts, cache(t => "heavy compute..."))
 * @param fn function to cache
 * @param getK optional function to extract {@link K} from {@link Ts}
 * @returns cached function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cache(fn, getK) {
    const cache = new Map();
    const k = getK !== null && getK !== void 0 ? getK : ((...ts) => ts[0]);
    return (...ts) => getOrSetMap(cache, k(...ts), () => fn(...ts));
}
/**
 * Wrap {@link fn} with a cache indexed by {@link K} it is refreshed every given {@link ticks}.
 * @param fn function to cache
 * @param ticks number of ticks to keep
 * @returns cached function
 */
function cacheForTicks(fn, ticks = 1) {
    const cache = new Map();
    return (key) => {
        const cached = cache.get(key);
        if (cached && cached[0] + ticks >= Game.time)
            return cached[1];
        const value = fn(key);
        cache.set(key, [Game.time, value]);
        return value;
    };
}

/** Maximum cpu units stored in your account buffer */
const CPU_BUCKET_MAX = 10000;
/** Base cpu cost of any successful action that changes game state */
const CPU_INTENT_COST = 0.2;

/**
 * Adjust your CPU limit per tick based on current and target bucket levels. It will never dip
 *   below a fifth of your bucket, to help out 20 CPU users.
 *
 * This uses sine functions to adjust a limit multiplier from 0 at 0 bucket, to 1 at the target
 *   bucket, to 2 at full bucket. If you are a 20 CPU user, after the multiplier hits 1.5, it will
 *   add 1 to the multiplier, so you can burn through more of the available bucket. This is to assist
 *   in taking full advantage of the free 1k bucket during reset storms.
 *
 * https://imgur.com/a/9PN5z the curve of the multiplier where the target bucket is 8k (default)
 * @author semperrabbit 20180302
 * @param target        - The bucket level you want your AI to stablize at
 *                            (Optional: defaults to 8000)
 * @param maxCpuPerTick - What you want to recognize as the max limit for your code to use
 *                            (Optional: defaults to 495)
 * @param limit         - Your current static limit
 *                            (Optional: defaults to {@link Game.cpu.limit})
 * @param bucket        - Your current bucket
 *                            (Optional: defaults to {@link Game.cpu.bucket})
 * @returns An alternative value for {@link Game.cpu.limit} helping to maintain a {@link target} bucket level.
 */
function adjustedCPULimit(target = CPU_BUCKET_MAX * 0.8, maxCpuPerTick = 495, limit = Game.cpu.limit, bucket = Game.cpu.bucket) {
    let multiplier = 1;
    if (bucket < target) {
        multiplier = Math.sin((Math.PI * bucket) / (2 * target));
    }
    if (bucket > target) {
        // Thanks @Deign for support with the sine function below
        multiplier =
            2 + Math.sin((Math.PI * (bucket - CPU_BUCKET_MAX)) / (2 * (CPU_BUCKET_MAX - target)));
        // take care of our 10 CPU folks, to dip into their bucket reserves more...
        // help them burn through excess bucket above the target.
        if (limit <= 20 && multiplier > 1.5)
            multiplier += 1;
    }
    return clamp(Math.round(limit * 0.2), Math.round(limit * multiplier), maxCpuPerTick);
}

/**
 * Generate a text which trigger a download popup
 * @param filename downloaded file name
 * @param content downloaded file content
 */
function showFileDownloadPopup(filename, content) {
    const id = `id${Math.random()}`;
    const download = `
<script>
var element = document.getElementById('${id}');
if (!element) {
element = document.createElement('a');
element.setAttribute('id', '${id}');
element.setAttribute('href', 'data:text/plain;charset=utf-8,${encodeURIComponent(content)}');
element.setAttribute('download', '${filename.replace("'", "\\'")}');

element.style.display = 'none';
document.body.appendChild(element);

element.click();
}
</script>
  `;
    console.log(download
        .split("\n")
        .map((s) => s.trim())
        .join(""));
}

/* eslint-disable @typescript-eslint/no-unnecessary-condition */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { performance } = global;
const getUsedCpu = IS_SIM ? () => performance.now() : () => Game.cpu.getUsed();
class Profiler {
    constructor(getData, dummy = false) {
        this.getData = getData;
        this.dummy = dummy;
        this.marker = Symbol();
        this.currentKey = "(tick)";
        this.refreshData();
    }
    refreshData() {
        var _a;
        const data = this.getData();
        (_a = data.map) !== null && _a !== void 0 ? _a : (data.map = {});
        this.data = data;
    }
    enable() {
        this.data.on = 1;
    }
    disable() {
        delete this.data.on;
    }
    wrapLoop(loop) {
        if (this.dummy)
            return loop;
        this.refreshData();
        const fn = this.register(loop, "(loop)");
        return () => {
            if (!this.data.on)
                return fn();
            const start = IS_SIM ? getUsedCpu() : 0;
            this.currentKey = "(tick)";
            const tick = this.get("(tick)");
            tick[1]++;
            fn();
            tick[0] += getUsedCpu() - start;
        };
    }
    reset() {
        this.data.map = {};
        delete this.data.start;
    }
    registerObject(object, name) {
        if (!object)
            return; // prevent profiling undefined
        const { prototype } = object;
        if (prototype)
            this.registerObject(prototype, name);
        const o = object;
        for (const fnName of Object.getOwnPropertyNames(o)) {
            if (fnName === "constructor")
                continue; // es6 class constructors need to be called with new
            if (fnName === "getUsed")
                continue; // Let's avoid wrapping this... may lead to recursion issues and should be inexpensive.
            const key = `${name}.${fnName}`;
            const descriptor = Object.getOwnPropertyDescriptor(o, fnName);
            if (!descriptor)
                continue;
            const isFunction = typeof descriptor.value === "function";
            if (!isFunction || !descriptor.writable)
                continue;
            o[fnName] = this.register(o[fnName], key);
        }
    }
    register(fn, name) {
        if (this.dummy)
            return fn;
        if (fn[this.marker]) {
            console.log("Function already registered for profiler", fn);
            return fn;
        }
        const key = name !== null && name !== void 0 ? name : fn.name;
        if (!key) {
            console.log("No name of function to profile", fn);
            return fn;
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const p = this;
        const f = fn;
        function wrapped(...args) {
            var _a;
            var _b;
            if (!p.data.on)
                return this && this.constructor === wrapped
                    ? new f(...args)
                    : f.apply(this, args);
            const parentKey = p.currentKey;
            p.currentKey = key;
            const start = getUsedCpu();
            const result = this && this.constructor === wrapped
                ? new f(...args)
                : f.apply(this, args);
            const end = getUsedCpu();
            p.currentKey = parentKey;
            const time = end - start;
            (_a = (_b = p.data).start) !== null && _a !== void 0 ? _a : (_b.start = Game.time);
            p.record(key, time);
            return result;
        }
        wrapped[this.marker] = true;
        return wrapped;
    }
    get(key, map = this.data.map) {
        var _a;
        return ((_a = map[key]) !== null && _a !== void 0 ? _a : (map[key] = [0, 0, {}]));
    }
    /**
     * Manually add profiling timings
     * @param key profiled function name
     * @param time cpu usage
     * @param parentKey override parent function name
     */
    record(key, time, parentKey = this.currentKey) {
        if (!this.data.on)
            return;
        const root = this.get(key);
        root[0] += time;
        root[1]++;
        const parent = this.get(parentKey);
        const sub = this.get(key, parent[2]);
        sub[0] += time;
        sub[1]++;
    }
    getCallgrind() {
        var _a;
        const elapsedTicks = Game.time - ((_a = this.data.start) !== null && _a !== void 0 ? _a : Game.time) + 1;
        const tick = this.get("(tick)");
        const totalTime = tick[0];
        tick[1] = elapsedTicks;
        const root = this.get("(root)");
        root[0] = totalTime;
        root[1] = 1;
        const rootTick = this.get("(tick)", root[2]);
        rootTick[0] = totalTime;
        rootTick[1] = elapsedTicks;
        let body = `events: ns\nsummary: ${Math.round(totalTime * 1000000)}\n`;
        for (const key in this.data.map) {
            const [time, , subs] = this.data.map[key];
            let callsBody = "";
            let callsTime = 0;
            for (const callName in subs) {
                const [callTime, calls] = subs[callName];
                const ns = Math.round(callTime * 1000000);
                callsBody += `cfn=${callName}\ncalls=${calls} 1\n1 ${ns}\n`;
                callsTime += callTime;
            }
            body += `\nfn=${key}\n1 ${Math.round((time - callsTime) * 1000000)}\n${callsBody}`;
        }
        return body;
    }
    callgrind() {
        showFileDownloadPopup(`callgrind.out.${Game.time}`, this.getCallgrind());
    }
    getOutput(maxStats) {
        if (this.data.start === undefined)
            return "Profiler not active.";
        const elapsedTicks = Game.time - this.data.start + 1;
        const totalTime = this.get("(tick)")[0];
        const stats = sort(Object.entries(this.data.map), ([, [time, calls]]) => -time / calls);
        if (maxStats)
            stats.length = maxStats;
        return [
            "calls\t\ttime\t\tavg\t\tfunction",
            ...stats.map(([name, [time, calls]]) => `${calls}\t\t${time.toFixed(2)}\t\t${(time / calls).toFixed(3)}\t\t${name}`),
            `Ticks: ${elapsedTicks}\tTime: ${totalTime.toFixed(2)}\tPer tick: ${(totalTime / elapsedTicks).toFixed(3)}`,
        ].join("\n");
    }
    output(maxStats) {
        console.log(this.getOutput(maxStats));
    }
}

const ROOM_SIZE$2 = 50;
const ROOM_MIN = 0;
const ROOM_MAX = ROOM_SIZE$2 - 1;
/**
 * Map direction to unicode arrow symbol
 * @author warinternal 20170511
 */
const DIRECTION_ARROWS = {
    [TOP]: "\u2191",
    [TOP_RIGHT]: "\u2197",
    [RIGHT]: "\u2192",
    [BOTTOM_RIGHT]: "\u2198",
    [BOTTOM]: "\u2193",
    [BOTTOM_LEFT]: "\u2199",
    [LEFT]: "\u2190",
    [TOP_LEFT]: "\u2196",
};

/**
 * Whether or not this position is an exit. Ignoring terrain.
 * @param at A room position
 * @param range Optional distance to exits
 * @returns Is this position at the edge of the room
 */
function isExit(at, range = 0) {
    const { x, y } = at;
    return (x <= ROOM_MIN + range || x >= ROOM_MAX - range || y <= ROOM_MIN + range || y >= ROOM_MAX - range);
}
/**
 * Whether or not this position is inside of a room.
 * @param at A room position
 * @returns Is this position valid room coordinates
 */
function isInRoom(at) {
    const { x, y } = at;
    return x >= ROOM_MIN && y >= ROOM_MIN && x < ROOM_MAX && y < ROOM_MAX;
}
/**
 * Extract position from an object with a position
 * @param it Object with a position
 * @returns The RoomPosition
 */
function normalizePos$1(it) {
    if (!(it instanceof RoomPosition)) {
        return it.pos;
    }
    return it;
}
const ROOM_REGEX = /^([WE])([0-9]+)([NS])([0-9]+)$/;
/**
 * Split a room name in parts
 * @param roomName Valid name of a room
 * @returns Room name parts [full string, WE, x, NS, y]
 */
function parseRoomName(roomName) {
    return roomName.match(ROOM_REGEX);
}
/**
 * Convert a room name into a 2d point
 * @param roomName Valid name of a room
 * @returns 2d coordinates (1:ROOM_SIZE scale)
 */
function getRoomNameCoords(roomName) {
    let [, h, x, v, y] = parseRoomName(roomName);
    if (h == "W")
        x = ~x;
    if (v == "N")
        y = ~y;
    return { x, y };
}
/** Room type information without visibility required */
var RoomSectorKind;
(function (RoomSectorKind) {
    /** With portals and terminal */
    RoomSectorKind[RoomSectorKind["Intersection"] = -2] = "Intersection";
    /** With deposits and powerBanks */
    RoomSectorKind[RoomSectorKind["Highway"] = -1] = "Highway";
    /** With a controller aka normal */
    RoomSectorKind[RoomSectorKind["Controller"] = 0] = "Controller";
    /** With sourceKeepers and mineral */
    RoomSectorKind[RoomSectorKind["SourceKeeper"] = 1] = "SourceKeeper";
    /** With portals at sector's center */
    RoomSectorKind[RoomSectorKind["Center"] = 2] = "Center";
})(RoomSectorKind || (RoomSectorKind = {}));
/**
 * Get room type information without visibility required.
 * @param name Valid name of a room
 * @returns an enum with room kind
 */
function getRoomSectorKind(name) {
    if (name == "sim")
        return RoomSectorKind.Controller;
    const [, , wx, , wy] = parseRoomName(name);
    const [sx, sy] = [wx % 10, wy % 10];
    if (sx == 0 || sy == 0)
        return sx == 0 && sy == 0 ? RoomSectorKind.Intersection : RoomSectorKind.Highway;
    if (sx >= 4 && sx <= 6 && sy >= 4 && sy <= 6)
        return sx == 5 && sy == 5 ? RoomSectorKind.Center : RoomSectorKind.SourceKeeper;
    return RoomSectorKind.Controller;
}
/**
 * Compute center position of a room
 * @param name valid room name
 * @returns position at the middle of this room
 */
const getRoomCenter = (name) => new RoomPosition(ROOM_SIZE$2 / 2, ROOM_SIZE$2 / 2, name);
/**
 * Distance when moving only vertically, horizontally and diagonally.
 * Correct distance for in room creep movements.
 * @param a First point
 * @param b Second point
 * @returns Chebyshev distance between those points
 */
function getChebyshevDist(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
/**
 * Distance when moving only vertically or horizontally.
 * Correct distance for inter room creep movements.
 * @param a First point
 * @param b Second point
 * @returns Manhattan distance between those points
 */
function getManhattanDist(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
/**
 * Distance when moving at any angle.
 * @param a First point
 * @param b Second point
 * @returns Euclidean distance between those points
 */
function getEuclidDist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
/**
 * Compute the nearest angle between two point round to 8 directions
 * @param from First point
 * @param to Second point
 * @returns Direction constant
 */
function getDirectionTo(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (adx > ady * 2)
        return dx > 0 ? RIGHT : LEFT;
    if (ady > adx * 2)
        return dy > 0 ? BOTTOM : TOP;
    if (dx > 0 && dy > 0)
        return BOTTOM_RIGHT;
    if (dx > 0 && dy < 0)
        return TOP_RIGHT;
    if (dx < 0 && dy > 0)
        return BOTTOM_LEFT;
    return TOP_LEFT;
}
const DIR_OFFSET = {
    [TOP]: { x: 0, y: -1 },
    [TOP_RIGHT]: { x: 1, y: -1 },
    [RIGHT]: { x: 1, y: 0 },
    [BOTTOM_RIGHT]: { x: 1, y: 1 },
    [BOTTOM]: { x: 0, y: 1 },
    [BOTTOM_LEFT]: { x: -1, y: 1 },
    [LEFT]: { x: -1, y: 0 },
    [TOP_LEFT]: { x: -1, y: -1 },
};
/**
 * Compute position in a given direction
 * @param pos start position
 * @param d direction constant
 * @param n number of steps
 * @returns destination position
 */
function getToDirection(pos, d, n = 1) {
    const x = pos.x + DIR_OFFSET[d].x * n;
    const y = pos.y + DIR_OFFSET[d].y * n;
    return isInRoom({ x, y }) ? new RoomPosition(x, y, pos.roomName) : undefined;
}
/**
 * Clamp coordinates in room range.
 * @param at point to clamp
 * @returns clamped coordinates
 */
function clampInRoom(at) {
    const { x, y } = at;
    return { x: clamp(ROOM_MIN, x, ROOM_MAX), y: clamp(ROOM_MIN, y, ROOM_MAX) };
}
/**
 * List all {@link RoomPosition} in a given square clamped to room borders
 * @param center middle point
 * @param range positive integer
 * @yields a valid position
 */
function* inRoomRange(center, range = 1) {
    for (const { x, y } of inRoomRangeXY(center, range)) {
        yield new RoomPosition(x, y, center.roomName);
    }
}
/**
 * List all {@link Coordinates} in a given square clamped to room borders
 * @param center middle point
 * @param range positive integer
 * @yields a coordinate in room
 */
function* inRoomRangeXY(center, range = 1) {
    const mx = Math.min(ROOM_MAX, center.x + range);
    const my = Math.min(ROOM_MAX, center.y + range);
    for (let x = Math.max(ROOM_MIN, center.x - range); x <= mx; x++) {
        for (let y = Math.max(ROOM_MIN, center.y - range); y <= my; y++) {
            yield { x, y };
        }
    }
}
/**
 * Get an area in a given square clamped to room borders.
 * @param center middle point
 * @param range positive integer
 * @returns area in room
 */
function inRoomRangeArea(center, range = 1) {
    const { x, y } = center;
    return [
        Math.max(y - range, ROOM_MIN),
        Math.max(x - range, ROOM_MIN),
        Math.min(y + range, ROOM_MAX),
        Math.min(x + range, ROOM_MAX),
    ];
}
/**
 * List all {@link RoomPosition} at a given square border excluding out of room
 * @param center middle point
 * @param range positive integer
 * @yields a valid position
 */
function* atRoomRange(center, range = 1) {
    if (!range) {
        yield center;
        return;
    }
    const { x: cx, y: cy, roomName } = center;
    function* send(x, y) {
        if (isInRoom({ x, y }))
            yield new RoomPosition(x, y, roomName);
    }
    for (let d = -range; d < range; d++) {
        yield* send(cx + d, cy + range);
        yield* send(cx + range, cy - d);
        yield* send(cx - d, cy - range);
        yield* send(cx - range, cy + d);
    }
}
/**
 * Get all directions for nearest to oppositive of {@link d}.
 * @param d nearest direction
 * @returns a sorted array of directions
 */
const getDirectionsSorted = (d) => [
    d,
    rotateDirection(d, 1),
    rotateDirection(d, -1),
    rotateDirection(d, 2),
    rotateDirection(d, -2),
    rotateDirection(d, 3),
    rotateDirection(d, -3),
    rotateDirection(d, 4),
];
function rotateDirection(d, n) {
    return (((((d + n - 1) % 8) + 8) % 8) + 1);
}

/** Uniform screep's world position with E0S0 as origin. */
class WorldPosition {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * Extract room name from this.
     * In sim, it will return E0S0.
     * @returns the room name
     */
    getRoomName() {
        const [x, y] = [Math.floor(this.x / 50), Math.floor(this.y / 50)];
        let result = "";
        result += x < 0 ? "W" + String(~x) : "E" + String(x);
        result += y < 0 ? "N" + String(~y) : "S" + String(y);
        return result;
    }
    /**
     * Convert a {@link RoomPosition} to {@link WorldPosition}
     * @param at Object containing a position
     * @returns this
     */
    static fromRoom(at) {
        const p = normalizePos$1(at);
        if (!isInRoom(p))
            throw new RangeError(`${p.x},${p.y} not in range`);
        const { x, y, roomName } = p;
        if (roomName == "sim")
            return new WorldPosition(x, y);
        let [, h, wx, v, wy] = parseRoomName(roomName);
        if (h == "W")
            wx = ~wx;
        if (v == "N")
            wy = ~wy;
        return new WorldPosition(50 * wx + x, 50 * wy + y);
    }
    /**
     * Convert this to {@link RoomPosition}
     * @returns a RoomPosition representing same position
     */
    toRoom() {
        let [rx, x] = [Math.floor(this.x / 50), this.x % 50];
        let [ry, y] = [Math.floor(this.y / 50), this.y % 50];
        if (rx < 0 && x < 0)
            x = 49 - ~x;
        if (ry < 0 && y < 0)
            y = 49 - ~y;
        return new RoomPosition(x, y, this.getRoomName());
    }
    getRangeTo(to) {
        return getChebyshevDist(this, to);
    }
    inRangeTo(to, range = 1) {
        return this.getRangeTo(to) <= range;
    }
    getDirectionTo(to) {
        return getDirectionTo(this, to);
    }
    toString() {
        return `[world pos ${this.x},${this.y}]`;
    }
}
/**
 * Functional helper to compute a range between two {@link RoomPosition}.
 * Support multi-room thanks to {@link WorldPosition}
 * @param f initial position
 * @returns a function taking position and returning the distance to {@link f}
 */
function rangeTo(f) {
    const fw = WorldPosition.fromRoom(f);
    return (t) => fw.getRangeTo(WorldPosition.fromRoom(t));
}

/**
 * Apply distance transform in-place on a given matrix.
 *
 * Output values are distance to the nearest wall.
 * @param cm initial matrix with 1 representing walkable. Modified in-place
 * @param oob out of bound value (optional: default to 255)
 * @returns modified cost matrix
 */
function applyDistanceTransform(cm, oob = 255) {
    // Variables to represent the 3x3 neighborhood of a pixel.
    let UL, U, UR;
    let L, mid, R;
    let BL, B, BR;
    for (let y = 0; y < ROOM_SIZE$2; ++y) {
        for (let x = 0; x < ROOM_SIZE$2; ++x) {
            if (cm.get(x, y) !== 0) {
                UL = cm.get(x - 1, y - 1);
                U = cm.get(x, y - 1);
                UR = cm.get(x + 1, y - 1);
                L = cm.get(x - 1, y);
                if (y == 0) {
                    UL = oob;
                    U = oob;
                    UR = oob;
                }
                if (x == 0) {
                    UL = oob;
                    L = oob;
                }
                if (x == 49) {
                    UR = oob;
                }
                cm.set(x, y, Math.min(UL, U, UR, L, 254) + 1);
            }
        }
    }
    for (let y = ROOM_SIZE$2 - 1; y >= 0; --y) {
        for (let x = ROOM_SIZE$2 - 1; x >= 0; --x) {
            mid = cm.get(x, y);
            R = cm.get(x + 1, y);
            BL = cm.get(x - 1, y + 1);
            B = cm.get(x, y + 1);
            BR = cm.get(x + 1, y + 1);
            if (y == 49) {
                BL = oob;
                B = oob;
                BR = oob;
            }
            if (x == 49) {
                R = oob;
                BR = oob;
            }
            if (x == 0) {
                BL = oob;
            }
            const value = Math.min(mid, R + 1, BL + 1, B + 1, BR + 1);
            cm.set(x, y, value);
        }
    }
    return cm;
}
/** Maximum value of {@link CostMatrix} */
const MATRIX_MAX = 0xff;
/**
 * Convert {@link RoomTerrain} to {@link CostMatrix}
 * @param roomName target room name
 * @param plain value for {@link TERRAIN_MASK_PLAIN}
 * @param swamp value for {@link TERRAIN_MASK_SWAMP}
 * @param wall value for {@link TERRAIN_MASK_WALL}
 * @param exclude optional matrix with non-zero values considered as wall
 * @returns a matrix of the terrain for the given room
 */
function getRoomTerrainMatrix(roomName, plain = 1, swamp = 5, wall = MATRIX_MAX, exclude) {
    const cm = new PathFinder.CostMatrix();
    const terrain = Game.map.getRoomTerrain(roomName);
    for (let y = 0; y < ROOM_SIZE$2; ++y) {
        for (let x = 0; x < ROOM_SIZE$2; ++x) {
            const t = terrain.get(x, y);
            cm._bits[x * ROOM_SIZE$2 + y] =
                t & TERRAIN_MASK_WALL || (exclude === null || exclude === void 0 ? void 0 : exclude.get(x, y)) ? wall : t & TERRAIN_MASK_SWAMP ? swamp : plain;
        }
    }
    return cm;
}
/**
 * Apply distance transform algorithm for a given room.
 * @param roomName name of the target room. No visibility is needed
 * @param exclude optional matrix with non-zero values considered as wall
 * @returns A matrix where values are distance to the nearest wall
 */
function getRoomDistanceTransform$1(roomName, exclude) {
    return applyDistanceTransform(getRoomTerrainMatrix(roomName, 1, 1, 0, exclude));
}

/**
 * Iterator over a matrix cells
 * @param cm given cost matrix
 * @yields position and value
 */
function* iterateMatrix$2(cm) {
    for (let y = ROOM_MIN; y < ROOM_SIZE$2; ++y) {
        for (let x = ROOM_MIN; x < ROOM_SIZE$2; ++x) {
            yield { x, y, v: cm.get(x, y) };
        }
    }
}

/** Map creep actions with requires bodypart type */
const ACTION_BODYPART = {
    attack: "attack",
    heal: "heal",
    harvest: "work",
    build: "work",
    repair: "work",
    dismantle: "work",
    upgradeController: "work",
    rangedAttack: "ranged_attack",
    rangedMassAttack: "ranged_attack",
    rangedHeal: "heal",
    capacity: "carry",
    fatigue: "move",
    damage: "tough",
};
/** Map creep actions with power multiplier */
const ACTION_RANGE = {
    attack: 1,
    heal: 1,
    harvest: 1,
    dismantle: 1,
    build: 3,
    repair: 3,
    upgradeController: 3,
    rangedAttack: 3,
    rangedMassAttack: 3,
    rangedHeal: 3,
};
/** Map creep actions with required range */
const ACTION_RANGE_DICT = ACTION_RANGE;
/** Map creep actions with power multiplier */
const ACTION_POWER = {
    attack: ATTACK_POWER,
    heal: HEAL_POWER,
    harvest: HARVEST_POWER,
    dismantle: DISMANTLE_POWER,
    build: BUILD_POWER,
    repair: REPAIR_POWER,
    upgradeController: UPGRADE_CONTROLLER_POWER,
    rangedAttack: RANGED_ATTACK_POWER,
    rangedHeal: RANGED_HEAL_POWER,
};
/** Map creep actions with power multiplier */
const ACTION_POWER_DICT = ACTION_POWER;
/** Power of RANGED_MASS_ATTACK, dependent on range */
const RANGED_MASS_ATTACK_POWER = { 1: 10, 2: 4, 3: 1 };
/** Creep fatigue removal multiplier. Each move part remove this amount of fatigue */
const MOVE_FATIGUE_POWER = 2;
/** Creep fatigue generation multiplier. Each non-move part add this amount of fatigue depending on terrain */
const TERRAIN_MOVE_FATIGUE = {
    road: 1,
    plain: 2,
    swamp: 10,
};
/** Additional creep hits for each bodypart */
const HITS_PER_PART = 100;
/** Additional power creep hits for each level */
const POWER_CREEP_HITS_PER_LEVEL = 1000;

/**
 * Compute the energy cost of a creep body
 * @param body Array of bodyparts {@link Creep.body}
 * @returns Energy cost of this body
 */
function getBodyCost(body) {
    let sum = 0;
    for (const b of body)
        sum += BODYPART_COST[typeof b == "string" ? b : b.type];
    return sum;
}
/**
 * Count the number of bodyparts of a given type
 * @param body Array of bodyparts {@link Creep.body}
 * @param type Expected type
 * @param active Count only active bodyparts
 * @returns Number of bodyparts
 */
function getBodyparts(body, type, active = false) {
    let count = 0;
    for (let i = body.length; i-- > 0;) {
        if (active && body[i].hits <= 0)
            break;
        if (body[i].type == type)
            count += 1;
    }
    return count;
}
/**
 * Count the number of active bodyparts of a given type
 * @param body Array of bodyparts {@link Creep.body}
 * @param type Expected type
 * @returns Number of active bodyparts
 */
const getActiveBodyparts = (body, type) => getBodyparts(body, type, true);
/**
 * Compute the number of bodyparts of a given action taking boosts into account
 * @param body Array of bodyparts {@link Creep.body}
 * @param action Expected boosts to use
 * @param active Count only active bodyparts
 * @returns An equivalent number of unboosted bodyparts
 */
function getBodypartsBoostEquivalent(body, action, active = false) {
    const type = ACTION_BODYPART[action];
    let total = 0;
    for (let i = body.length; i-- > 0;) {
        const x = body[i];
        if (active && x.hits <= 0) {
            break;
        }
        if (x.type == type) {
            if (x.boost !== undefined) {
                const boost = BOOSTS[type][x.boost][action];
                total += boost > 1 ? boost : 2 - boost;
            }
            else {
                total += 1;
            }
        }
    }
    return total;
}
/**
 * Compute the number of active bodyparts of a given action taking boosts into account
 * @param body Array of bodyparts {@link Creep.body}
 * @param action Expected boosts to use
 * @returns An equivalent number of active unboosted bodyparts
 */
const getActiveBodypartsBoostEquivalent = (body, action) => getBodypartsBoostEquivalent(body, action, true);
/**
 * Gets the move efficiency of a creep based on it's number of move parts and boost relative to it's size.
 * @param creep target creep or powerCreep
 * @param usedCapacity override the amount of capacity the creep is using
 * @returns the amount of terrain fatigue the creep can handle
 */
function getMoveEfficiency(creep, usedCapacity = creep.store.getUsedCapacity()) {
    if (!("body" in creep))
        return Infinity; // no fatigue! PowerCreep!
    let activeMoveParts = 0;
    let nonMoveParts = 0;
    for (const b of creep.body) {
        switch (b.type) {
            case MOVE:
                activeMoveParts += b.hits > 0 ? (b.boost ? BOOSTS[b.type][b.boost].fatigue : 1) : 0;
                break;
            case CARRY:
                if (usedCapacity > 0 && b.hits > 0) {
                    usedCapacity -= b.boost
                        ? BOOSTS[b.type][b.boost].capacity * CARRY_CAPACITY
                        : CARRY_CAPACITY;
                    nonMoveParts += 1;
                }
                break;
            default:
                nonMoveParts += 1;
                break;
        }
    }
    if (nonMoveParts)
        return (activeMoveParts * MOVE_FATIGUE_POWER) / nonMoveParts;
    if (activeMoveParts)
        return Infinity;
    return 0;
}
/**
 * Compute the power of active bodyparts for a given action
 * @param body Array of bodyparts {@link Creep.body}
 * @param action expected action
 * @returns power for the given action
 */
function getBodypartsPower(body, action) {
    return getActiveBodypartsBoostEquivalent(body, action) * ACTION_POWER[action];
}

/** Clear Memory.creeps out of missing {@link Creep} */
function deleteDeadCreepsMemory() {
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete Memory.creeps[name];
        }
    }
}

/**
 * Typed check for {@link Structure.structureType}
 * @param s ths structure to check
 * @param type structure type constant
 * @returns whether this structure is of type
 */
function isStructureType(s, type) {
    return s.structureType == type;
}
/**
 * Typed filter for {@link Room.find}
 * @example room.find(FIND_STRUCTURES, { filter: filterStructureType(STRUCTURE_CONTAINER) })
 * @param type structure type constant
 * @returns filter object
 */
function filterStructureType(type) {
    return ((s) => isStructureType(s, type));
}
class StructuresByType {
    constructor(sts) {
        this.map = new Map();
        this.length = sts.length;
        for (const s of sts) {
            const exists = this.map.get(s.structureType);
            if (exists) {
                exists.push(s);
            }
            else {
                this.map.set(s.structureType, [s]);
            }
        }
    }
    [Symbol.iterator]() {
        return this.map.entries();
    }
    get(type) {
        var _a;
        return (_a = this.map.get(type)) !== null && _a !== void 0 ? _a : [];
    }
}
/**
 * Compute a level comparable with {@link StructureController} level evaluating built structures.
 * @param sbt storage of all structures by type
 * @param requiredStructures structure types needed for a level to be complete
 * @returns an object like {@link GlobalControlLevel}
 */
function getStructuralLevel(sbt, requiredStructures = defaultRequiredStructures) {
    const maxLevel = 8;
    for (let l = 1; l <= maxLevel; l++) {
        if (!requiredStructures.every((type) => sbt.get(type).length >= CONTROLLER_STRUCTURES[type][l])) {
            const progress = sum(requiredStructures, (type) => sbt.get(type).length * CONSTRUCTION_COST[type]);
            const progressTotal = sum(requiredStructures, (type) => (CONTROLLER_STRUCTURES[type][l] || 0) * CONSTRUCTION_COST[type]);
            return { level: l - 1, progress, progressTotal };
        }
    }
    return { level: maxLevel, progress: 0, progressTotal: 0 };
}
const defaultRequiredStructures = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_OBSERVER,
    STRUCTURE_TERMINAL,
    STRUCTURE_LAB,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
];
/**
 * Compute ticks until a {@link StructureRoad} is destroyed by time decay.
 * @param road the road to check
 * @returns ticks until decay
 */
function getRoadTicksToDestroy(road) {
    const { ticksToDecay, hits, hitsMax } = road;
    const decayCycles = Math.floor(hits / (hitsMax * (ROAD_HITS / ROAD_DECAY_AMOUNT)));
    return decayCycles * ROAD_DECAY_TIME + ticksToDecay;
}

/** The set of {@link OBSTACLE_OBJECT_TYPES} */
const OBSTACLE_TYPES = new Set(OBSTACLE_OBJECT_TYPES);
OBSTACLE_TYPES.add("portal");
/** The set of destructible {@link OBSTACLE_OBJECT_TYPES} */
const OBSTACLE_TYPES_DESTRUCTIBLE = new Set([
    "constructedWall",
    "spawn",
    "extension",
    "link",
    "storage",
    "observer",
    "tower",
    "powerBank",
    "powerSpawn",
    "lab",
    "terminal",
]);
/** The set of non-destructible {@link OBSTACLE_OBJECT_TYPES} */
const OBSTACLE_TYPES_NO_DESTRUCTIBLE = new Set(OBSTACLE_TYPES);
for (const t of OBSTACLE_TYPES_DESTRUCTIBLE)
    OBSTACLE_TYPES_NO_DESTRUCTIBLE.delete(t);
/**
 * Check is a structure is an obstacle (not walkable).
 * @param s target structure
 * @param allowPublicRampart ignore public rampart
 * @param allowDestructible ignore destructible structures
 * @returns is an obstacle
 */
function isObjectObstacle(s, allowPublicRampart = false, allowDestructible = false) {
    if (allowDestructible)
        return OBSTACLE_TYPES_NO_DESTRUCTIBLE.has(s.structureType);
    return (OBSTACLE_TYPES.has(s.structureType) ||
        (isStructureType(s, STRUCTURE_RAMPART) && !s.my && (!s.isPublic || !allowPublicRampart)));
}

/**
 * Correctly typed `Game.rooms[name]`.
 * @param name target room name
 * @returns a room if visible
 */
function getRoom(name) {
    return Game.rooms[name];
}
/**
 * Find neighbor rooms without need for visibility.
 * @param origin starting room
 * @param dist optional: number of rooms from starting point
 * @param pred optional: condition for a room to be visited
 * @returns a set of neighbor room names excluding {@link origin}
 */
function describeAdjacentRooms(origin, dist = 1, pred = () => true) {
    const res = new Set([origin]);
    let q = [origin];
    for (let i = 1; i <= dist; i++) {
        const nq = [];
        for (const from of q) {
            const exits = Game.map.describeExits(from);
            for (const exit in exits) {
                const to = exits[exit];
                if (!to || res.has(to) || !pred(to, i, from))
                    continue;
                res.add(to);
                nq.push(to);
            }
        }
        q = nq;
    }
    res.delete(origin);
    return res;
}
/**
 * Guess sources capacity based on room ownership.
 * @param room a room (maybe partial)
 * @returns a number of energy units
 */
function getRoomSourcesCapacity(room) {
    if (!room.controller)
        return SOURCE_ENERGY_KEEPER_CAPACITY;
    if (room.controller.owner || room.controller.reservation)
        return SOURCE_ENERGY_CAPACITY;
    return SOURCE_ENERGY_NEUTRAL_CAPACITY;
}

/**
 * Run {@link Room.lookAtArea} on a given range bounded to room borders
 * @param center Center position
 * @param range Optional range
 * @returns List of results
 */
function lookInRange(center, range = 1) {
    var _a, _b;
    return (_b = (_a = getRoom(center.roomName)) === null || _a === void 0 ? void 0 : _a.lookAtArea(...inRoomRangeArea(center, range), true)) !== null && _b !== void 0 ? _b : [];
}
/**
 * Run {@link Room.lookForAt} on a given range bounded to room borders
 * @param center Center position
 * @param type LOOK_* constant
 * @param range Optional range
 * @yields Iterator of results
 */
function* lookForInRange(center, type, range = 1) {
    const room = getRoom(center.roomName);
    if (!room)
        return;
    for (const { x, y } of inRoomRangeXY(center, range)) {
        yield* room.lookForAt(type, x, y);
    }
}
/**
 * Run {@link Room.lookForAtArea} on a given range bounded to room borders
 * @param center Center position
 * @param type LOOK_* constant
 * @param range Optional range
 * @returns List of results
 */
function lookForMatrixInRange(center, type, range = 1) {
    var _a, _b;
    return ((_b = (_a = getRoom(center.roomName)) === null || _a === void 0 ? void 0 : _a.lookForAtArea(type, ...inRoomRangeArea(center, range), true)) !== null && _b !== void 0 ? _b : []);
}
/**
 * Run {@link Room.lookForAt} {@link LOOK_STRUCTURES} on a given range bounded to room borders
 * @param center Center position
 * @param type STRUCTURE_* constant
 * @param range Optional range
 * @yields Iterator of structures
 */
function* lookForStructureInRange(center, type, range = 1) {
    for (const s of lookForInRange(center, LOOK_STRUCTURES, range)) {
        if (s.structureType == type)
            yield s;
    }
}
/**
 * Run {@link RoomPosition.lookFor} {@link LOOK_STRUCTURES} on a given pos
 * @param pos Target position
 * @param type STRUCTURE_* constant
 * @yields Iterator of structures
 */
function* lookForStructureAt(pos, type) {
    for (const s of pos.lookFor(LOOK_STRUCTURES)) {
        if (s.structureType == type)
            yield s;
    }
}

/**
 * Create objects matrix for a visible room or use cache.
 * @param name target room name
 * @param opts matrix content options
 * @param cache an optional cache map
 * @returns a CostMatrix of objects in the room
 */
function getRoomMatrix(name, opts, cache = {}) {
    const cache_ = cache;
    let key = name;
    if (!opts.ignoreStructures)
        key += opts.ignoreDestructibleStructures ? "s" : "S";
    if (opts.avoidRoads)
        key += "r";
    else if (!opts.ignoreRoads)
        key += "R";
    if (!opts.ignoreCreeps)
        key += "c";
    if (opts.avoidMyConstructionSites)
        key += "x";
    if (opts.avoidMySpawns)
        key += "q";
    const cached = cache_[key];
    if (cached && cached[0] == Game.time)
        return cached[1];
    let matrix = undefined;
    const block = (ps, v = 0xff) => {
        if (!ps.length)
            return;
        matrix !== null && matrix !== void 0 ? matrix : (matrix = new PathFinder.CostMatrix());
        for (const { pos: { x, y }, } of ps)
            matrix.set(x, y, v);
    };
    const room = getRoom(name);
    if (room) {
        if (!opts.ignoreRoads || opts.avoidRoads) {
            block(room.find(FIND_STRUCTURES, {
                filter: { structureType: STRUCTURE_ROAD },
            }), opts.avoidRoads ? 10 : 1);
        }
        if (!opts.ignoreStructures) {
            block(room.find(FIND_STRUCTURES, {
                filter: (s) => isObjectObstacle(s, false, opts.ignoreDestructibleStructures),
            }));
        }
        if (!opts.ignoreCreeps) {
            block(room.find(FIND_CREEPS));
            block(room.find(FIND_POWER_CREEPS));
        }
        if (opts.avoidMyConstructionSites) {
            block(room.find(FIND_MY_CONSTRUCTION_SITES), 50);
        }
        if (opts.avoidMySpawns) {
            const sps = room.find(FIND_MY_SPAWNS);
            if (sps.length) {
                matrix !== null && matrix !== void 0 ? matrix : (matrix = new PathFinder.CostMatrix());
                for (const s of sps)
                    for (const p of inRoomRangeXY(s.pos))
                        matrix.set(p.x, p.y, 50);
            }
        }
    }
    else {
        if (key.endsWith("c"))
            key.slice(0, -1);
        const old = cache_[key];
        if (old)
            return old[1];
    }
    cache_[key] = [Game.time, matrix];
    return matrix;
}

/**
 * Check if terrain value is wall
 * @param terrain {@link RoomTerrain.get} value
 * @returns is a terrain wall
 */
const isTerrainWall = (terrain) => !!(terrain & TERRAIN_MASK_WALL);
/**
 * Check if positions are {@link TERRAIN_MASK_SWAMP}
 * @returns a function to check terrain at position
 */
function getIsSwamp() {
    let t;
    let r;
    return ({ x, y, roomName }) => {
        if (!t || r !== roomName) {
            t = Game.map.getRoomTerrain(roomName);
            r = roomName;
        }
        return !!(t.get(x, y) & TERRAIN_MASK_SWAMP);
    };
}
/**
 * Check than coordinates are not {@link TERRAIN_MASK_WALL}
 * @param roomName target room name
 * @returns a function to check terrain at coordinates
 */
function getIsTerrainWalkable(roomName) {
    const t = Game.map.getRoomTerrain(roomName);
    return ({ x, y }) => !(t.get(x, y) & TERRAIN_MASK_WALL);
}
/**
 * Check than position is not {@link TERRAIN_MASK_WALL}
 * @param p target position
 * @returns can walk at position terrain
 */
function isTerrainWalkableAt(p) {
    return !(Game.map.getRoomTerrain(p.roomName).get(p.x, p.y) & TERRAIN_MASK_WALL);
}
/**
 * Get exits coordinates from room name
 * @param name target room name
 * @yields exits coordinates
 */
function* getExits(name) {
    const t = Game.map.getRoomTerrain(name);
    for (let i = 0; i <= ROOM_MAX; i++) {
        if (!(t.get(0, i) & TERRAIN_MASK_WALL))
            yield { x: 0, y: i };
        if (!(t.get(i, 0) & TERRAIN_MASK_WALL))
            yield { x: i, y: 0 };
        if (!(t.get(ROOM_MAX, i) & TERRAIN_MASK_WALL))
            yield { x: ROOM_MAX, y: i };
        if (!(t.get(i, ROOM_MAX) & TERRAIN_MASK_WALL))
            yield { x: i, y: ROOM_MAX };
    }
}

const IN_RANGE = 1;
function setMem(mem, vals) {
    vals.forEach((v, i) => (mem[i] = v));
    return mem;
}
function getPathNext(from, path) {
    if (!path.length)
        return undefined;
    for (let i = 0; i < path.length; i++)
        if (from.isEqualTo(path[i]))
            return i + 1;
    for (let i = path.length; i >= 0; i--)
        if (from.isNearTo(path[i]))
            return i;
    return undefined;
}
function serializePath(from, path) {
    let ret = ""; //MAYBE: multi room path
    let cur = { x: from.x, y: from.y };
    for (const next of path) {
        if (next.roomName != from.roomName)
            break;
        ret = getDirectionTo(cur, next).toString() + ret;
        cur = next;
    }
    return ret;
}
function deserializePath(from, path) {
    const ret = [];
    let cur = from;
    for (let i = path.length - 1; i >= 0; i--) {
        const dir = Number(path[i]);
        const next = getToDirection(cur, dir);
        if (!next)
            break;
        ret.push(next);
        cur = next;
    }
    return ret;
}
function go(c, dir, getMemory, move, noPush) {
    var _a, _b;
    const dest = getToDirection(c.pos, dir);
    if (!dest)
        return c.move(dir);
    if (!isTerrainWalkableAt(dest))
        return ERR_INVALID_TARGET;
    if (dest.lookFor(LOOK_STRUCTURES).some((l) => isObjectObstacle(l, true)))
        return ERR_INVALID_TARGET;
    // Other creeps moving to the same position
    for (const o of lookForInRange(dest, LOOK_CREEPS, 1)) {
        if (o === c || !o.my || o.pos.isEqualTo(dest))
            continue;
        const oMem = getMemory(o);
        if (!oMem.length || !oMem[8].length || oMem[7] != Game.time)
            continue;
        const oDir = Number(oMem[8][oMem[8].length - 1]);
        if (!((_a = getToDirection(o.pos, oDir)) === null || _a === void 0 ? void 0 : _a.isEqualTo(dest)))
            continue;
        //TODO: if c.priority > o.priority moveTo(o)
        return ERR_FULL;
    }
    const blocker = dest.lookFor(LOOK_CREEPS)[0];
    if (blocker && (blocker.my || !((_b = c.room.controller) === null || _b === void 0 ? void 0 : _b.my) || !c.room.controller.safeMode)) {
        if (!blocker.my || blocker.fatigue || blocker.spawning)
            return ERR_FULL;
        const bMem = [...getMemory(blocker)];
        if (!bMem.length)
            return ERR_FULL;
        const [bRoomName, bX, bY, bRange, , , , bTime] = bMem;
        if (bTime !== Game.time) {
            const bTo = new RoomPosition(bX, bY, bRoomName);
            if (!(bTo.inRangeTo(c.pos, bRange) && move(blocker, c.pos, true)) && // swap
                (noPush ||
                    (!move(blocker, bTo) && // closer
                        !some(getDirectionsSorted(dir), (bDir) => {
                            const bToOther = getToDirection(blocker.pos, bDir);
                            return (!!bToOther &&
                                !isExit(bToOther) &&
                                bTo.inRangeTo(bToOther, bRange) &&
                                move(blocker, bToOther));
                        }))) // still in range
            )
                return ERR_FULL;
        }
    }
    return c.move(dir);
}
function goAround(c, dir, nextDir, getMemory, move, noPush) {
    const code = go(c, dir, getMemory, move, noPush);
    if (code == OK)
        return OK;
    if (!nextDir)
        return code;
    const next = getToDirection(c.pos, dir);
    if (!next)
        return code;
    const nextNext = getToDirection(next, nextDir);
    if (!nextNext)
        return code;
    for (const dirBis of getDirectionsSorted(dir)) {
        if (dirBis == nextDir)
            continue;
        const bis = getToDirection(c.pos, dirBis);
        if (!(bis === null || bis === void 0 ? void 0 : bis.isNearTo(nextNext)))
            continue;
        if (go(c, dirBis, getMemory, move, noPush) == OK)
            return [dirBis, getDirectionTo(bis, nextNext)];
    }
    return code;
}
/**
 * Compute path with {@link goTo} options.
 * @param from initial position
 * @param to target position
 * @param opts parameters
 * @param roomMatrixCache cache for room matrices
 * @returns a path to the target
 */
function findGoToPath(from, to, opts, roomMatrixCache = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { range = 1, efficiency } = opts;
    if (!range && from.isNearTo(to))
        return { path: [to] };
    //TODO: else if from.inRangeTo(to, range + 1)
    if ((_b = (_a = opts.path) === null || _a === void 0 ? void 0 : _a[opts.path.length - 1]) === null || _b === void 0 ? void 0 : _b.inRangeTo(to, range)) {
        const idx = getPathNext(from, opts.path);
        if (idx !== undefined && idx < opts.path.length)
            return { path: idx ? opts.path.slice(idx) : opts.path };
    }
    (_c = opts.ignoreRoads) !== null && _c !== void 0 ? _c : (opts.ignoreRoads = efficiency >= TERRAIN_MOVE_FATIGUE.swamp);
    const fromRoom = from.roomName;
    const toRoom = to.roomName;
    const { excludeRoom, costCallback, ignoreRoads } = opts;
    const cmOpts = Object.assign({ ignoreCreeps: true }, opts);
    const ret = PathFinder.search(from, { range, pos: to }, {
        roomCallback: (n) => {
            var _a;
            const name = n;
            if (excludeRoom && name != fromRoom && name != toRoom && excludeRoom(name))
                return false;
            let matrix = getRoomMatrix(name, cmOpts, roomMatrixCache);
            if (costCallback) {
                matrix = (_a = matrix === null || matrix === void 0 ? void 0 : matrix.clone()) !== null && _a !== void 0 ? _a : new PathFinder.CostMatrix();
                const outcome = costCallback(n, matrix);
                if (outcome !== undefined)
                    return outcome;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return matrix; //NOTE: undefined == empty matrix
        },
        maxOps: (_d = opts.maxOps) !== null && _d !== void 0 ? _d : (((_e = opts.maxRooms) !== null && _e !== void 0 ? _e : Infinity) > 1 && fromRoom != toRoom ? 20000 : undefined),
        maxRooms: opts.maxRooms,
        plainCost: (_f = opts.plainCost) !== null && _f !== void 0 ? _f : (efficiency >= TERRAIN_MOVE_FATIGUE.plain || ignoreRoads ? 1 : 2),
        swampCost: (_g = opts.swampCost) !== null && _g !== void 0 ? _g : Math.max(1, Math.ceil((TERRAIN_MOVE_FATIGUE.swamp / efficiency) * (ignoreRoads ? 1 : 2))),
        heuristicWeight: (_h = opts.heuristicWeight) !== null && _h !== void 0 ? _h : 1.1,
    });
    if (!ret.path.length || ret.path[0].roomName != fromRoom)
        ret.path = [];
    return ret;
}
/**
 * Read {@link goTo} cached path from creep memory
 * @param c target creep
 * @param to destination to check
 * @param getMemory same as {@link goTo}
 * @param limit max positions to deserialize
 * @returns a cached path
 */
function getGoToPath(c, to, getMemory, limit) {
    if (!c.my)
        return [];
    const mem = getMemory(c);
    if (!mem.length)
        return [];
    const [mToRoom, mToX, mToY, , , , , mTime, mPath] = mem;
    if (to.x != mToX || to.y != mToY || to.roomName != mToRoom)
        return [];
    const cut = Game.time == mTime;
    return deserializePath(c.pos, mPath.slice(limit ? mPath.length - Number(cut) - limit : 0, cut ? -1 : undefined));
}
/**
 * {@link Creep.moveTo} with smart push
 * @param c target creep
 * @param target destination
 * @param getMemory get a persistant array of data for a given creep. `c => c.memory._m ?? []`
 * @param roomMatrixCache cache for room matrices
 * @param opts movement parameters
 * @returns status code
 */
function goTo(c, target, getMemory, roomMatrixCache = {}, opts = {}) {
    var _a, _b, _c, _d, _e, _f;
    var _g, _h;
    if (!c.my)
        return ERR_NOT_OWNER;
    if (c.spawning)
        return ERR_BUSY;
    const to = normalizePos$1(target);
    if (!to)
        return ERR_INVALID_TARGET;
    const range = (opts.range = isExit(to)
        ? 0
        : Math.min((_a = opts.range) !== null && _a !== void 0 ? _a : 1, to.x, to.y, ROOM_MAX - to.x, ROOM_MAX - to.y));
    (_b = opts.priority) !== null && _b !== void 0 ? _b : (opts.priority = 0);
    (_c = opts.reusePath) !== null && _c !== void 0 ? _c : (opts.reusePath = Infinity);
    const from = c.pos;
    const defaultM = [
        to.roomName,
        to.x,
        to.y,
        range,
        opts.priority,
        from.x,
        from.y,
        0,
        "",
    ];
    const partialMem = getMemory(c);
    const mem = partialMem.length ? partialMem : setMem(partialMem, defaultM);
    const [mToRoom, mToX, mToY, , , mPrevX, mPrevY, mTime] = mem;
    if (to.x == mToX && to.y == mToY && to.roomName == mToRoom) {
        if (mTime == Game.time)
            return from.inRangeTo(to, range) ? IN_RANGE : OK;
    }
    else {
        setMem(mem, defaultM);
    }
    if (from.inRangeTo(to, range))
        return IN_RANGE;
    if (c.fatigue)
        return ERR_TIRED;
    if (mem[8].length > 1 &&
        opts.reusePath &&
        (from.x != mPrevX || from.y != mPrevY) &&
        !isExit(from)) {
        mem[8] = mem[8].slice(0, -1);
    }
    else {
        mem[8] = "";
    }
    const efficiency = getMoveEfficiency(c, opts.usedCapacity);
    if (!efficiency)
        return ERR_NO_BODYPART;
    if (!mem[8].length) {
        // Repath
        if (opts.noPathFinding)
            return ERR_NOT_FOUND;
        const ret = findGoToPath(from, to, Object.assign(opts, { efficiency }), roomMatrixCache);
        if (opts.ret && "cost" in ret) {
            (_d = (_g = opts.ret).searches) !== null && _d !== void 0 ? _d : (_g.searches = 0);
            opts.ret.searches += 1;
            (_e = (_h = opts.ret).ops) !== null && _e !== void 0 ? _e : (_h.ops = 0);
            opts.ret.ops += ret.ops;
            opts.ret.path = ret;
        }
        mem[8] = serializePath(from, ret.path);
        if (!mem[8].length)
            return ERR_NO_PATH;
    }
    function doPush(o, to, noPush) {
        const oMemPrev = [...getMemory(o)];
        const ok = goTo(o, to, getMemory, roomMatrixCache, {
            range: 0,
            ignoreCreeps: true,
            noPush,
            ret: opts.ret,
        }) == OK;
        // Restore previous memory
        const oMem = getMemory(o);
        if (ok && oMem.length) {
            const [oRoomName, oX, oY, oRange] = oMemPrev;
            oMem[3] = oRange;
            if (oMem[1] !== oX || oMem[2] !== oY || oMem[0] !== oRoomName) {
                oMem[1] = oX;
                oMem[2] = oY;
                oMem[0] = oRoomName;
                oMem[8] = "";
            }
        }
        else {
            setMem(oMem, oMemPrev);
        }
        return ok;
    }
    const path = mem[8];
    const retPath = (_f = opts.ret) === null || _f === void 0 ? void 0 : _f.path;
    setMem(mem, defaultM);
    if (opts.reusePath)
        mem[8] = path;
    mem[7] = Game.time; //NOTE: assume will move to allow swap
    const dir = Number(path[path.length - 1]);
    const nextDir = path.length > 1 ? Number(path[path.length - 2]) : undefined;
    const code = goAround(c, dir, nextDir, getMemory, doPush, opts.noPush);
    if (opts.ret)
        opts.ret.path = retPath;
    if (code === OK)
        return OK;
    if (Array.isArray(code)) {
        if (path === mem[8]) {
            const [cur, next] = code;
            mem[8] = mem[8].slice(0, -2) + next.toString() + cur.toString();
        }
        return OK;
    }
    mem[7] = 0;
    if (opts.ignoreCreeps === undefined) {
        opts.ignoreCreeps = false;
        delete opts.path;
        getMemory(c).length = 0;
        return goTo(c, target, getMemory, roomMatrixCache, opts);
    }
    return ERR_NOT_IN_RANGE;
}

const defaultFindRouteCached = cache((f, t) => Game.map.findRoute(f, t), (f, t) => f + t);
/**
 * Provide a function like {@link Game.map.findRoute} but with cache.
 * It requires than routeCallback is deterministic
 * @param routeCallback optional function computing the cost to enter a room
 * @returns a function like findRoute
 */
function findRouteCached(routeCallback) {
    if (!routeCallback)
        return defaultFindRouteCached;
    return cache((f, t) => Game.map.findRoute(f, t, {
        routeCallback: routeCallback,
    }), (f, t) => f + t);
}
/**
 * Compute a distance lower bound from {@link Game.map.findRoute} path.
 * @param from start position
 * @param to destination position
 * @param findRoute optional replace the default route finder
 * @returns a distance between two points considering exit sides
 */
function findRouteDist(from, to, findRoute = defaultFindRouteCached) {
    const route = findRoute(from.roomName, to.roomName);
    if (route === ERR_NO_PATH)
        return Infinity;
    const EXIT_MIN = 2;
    const EXIT_MAX = ROOM_MAX - EXIT_MIN;
    let dist = 0;
    let xMin = from.x;
    let xMax = from.x;
    let yMin = from.y;
    let yMax = from.y;
    for (const { exit } of route) {
        switch (exit) {
            case FIND_EXIT_TOP:
                dist += yMin;
                xMin = Math.max(EXIT_MIN, xMin - yMin);
                xMax = Math.min(EXIT_MAX, xMax + yMin);
                yMin = yMax = ROOM_MAX;
                break;
            case FIND_EXIT_RIGHT: {
                const dX = ROOM_MAX - xMax;
                dist += dX;
                yMin = Math.max(EXIT_MIN, yMin - dX);
                yMax = Math.min(EXIT_MAX, yMax + dX);
                xMin = xMax = 0;
                break;
            }
            case FIND_EXIT_BOTTOM: {
                const dY = ROOM_MAX - yMax;
                dist += dY;
                xMin = Math.max(EXIT_MIN, xMin - dY);
                xMax = Math.min(EXIT_MAX, xMax + dY);
                yMin = yMax = 0;
                break;
            }
            case FIND_EXIT_LEFT:
                dist += xMin;
                yMin = Math.max(EXIT_MIN, yMin - xMin);
                yMax = Math.min(EXIT_MAX, yMax + xMin);
                xMin = xMax = ROOM_MAX;
                break;
        }
    }
    dist += Math.max(to.x - xMax, xMin - to.x, to.y - yMax, yMin - to.y, 0);
    return dist;
}

/** The distance labs need to be within to be able to {@link StructureLab.runReaction} or {@link StructureLab.reverseReaction} */
const LAB_REACT_RANGE = 2;
/** The distance a creep and a lab need to be to {@link StructureLab.boostCreep} or {@link StructureLab.unboostCreep} */
const LAB_BOOST_RANGE = 1;
/** The maximum amount of deals that can be done on the market in one tick */
const MARKET_MAX_DEALS_PER_TICK = 10;

/**
 * Optimized check for {@link Structure.isActive}.
 * If using default getMaxLevel, you should call {@link isStructureActive.update} in your loop.
 * @author tigga 20180224
 * @param getMaxLevel optional: function to get the maximum level this controller ever got
 * @returns whether {@link Structure.isActive}
 */
function isStructureActive(getMaxLevel = (c) => c.room.memory[maxRclKey] || 0) {
    return (s) => !s.room.controller || s.room.controller.level == getMaxLevel(s.room.controller) || s.isActive();
}
/** Write maximum controller level in Game.rooms[name].memory.#mRCL */
isStructureActive.update = function () {
    var _a;
    for (const name in Game.rooms) {
        const room = Game.rooms[name];
        const level = (_a = room.controller) === null || _a === void 0 ? void 0 : _a.level;
        if (level) {
            const memory = room.memory;
            memory[maxRclKey] = Math.max(memory[maxRclKey], level);
        }
    }
};
const maxRclKey = "#mRCL";

/**
 * Compute tower effectiveness at a given range.
 * @param dist range between the tower and target
 * @returns Tower power ratio (between 0 and 1)
 */
function getTowerRangeRatio(dist) {
    if (dist >= TOWER_FALLOFF_RANGE)
        return 1 - TOWER_FALLOFF;
    const towerFalloffPerTile = TOWER_FALLOFF / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
    return 1 - Math.max(0, dist - TOWER_OPTIMAL_RANGE) * towerFalloffPerTile;
}

/**
 * Compute total global control progress {@link Game.gcl} ignoring levels.
 * @returns total global control progress
 */
const getGclCumulatedProgress = () => getGxlCumulatedProgress(Game.gcl, GCL_POW, GCL_MULTIPLY);
/**
 * Compute total global power progress {@link Game.gpl} ignoring levels.
 * @returns total global power progress
 */
const getGplCumulatedProgress = () => getGxlCumulatedProgress(Game.gpl, POWER_LEVEL_POW, POWER_LEVEL_MULTIPLY);
function getGxlCumulatedProgress({ level, progress }, pow, multiply) {
    return Math.pow(level - 1, pow) * multiply + progress;
}
/**
 * Compute total {@link StructureController} progress ignoring levels.
 * @param ctrl target controller
 * @returns controller total progress
 */
function getControllerCumulatedProgress(ctrl) {
    let progress = ctrl.progress;
    for (let i = 1; i < ctrl.level; i++)
        progress += CONTROLLER_LEVELS[i];
    return progress;
}
/**
 * Compute level of {@link StructureContainer}, Game.gcl or Game.gpl with added progress ratio.
 * @param it target thing with progress
 * @returns level with 2 decimal for progress
 */
function getLevelWithProgress(it) {
    const { level, progress, progressTotal } = it;
    return level + Math.round(Math.min(0.99, progress / progressTotal) * 100) / 100;
}

var dist = /*#__PURE__*/Object.freeze({
	__proto__: null,
	IS_SIM: IS_SIM,
	IS_MMO: IS_MMO,
	PLAYER_USERNAME: PLAYER_USERNAME,
	INVADER_USERNAME: INVADER_USERNAME,
	SOURCE_KEEPER_USERNAME: SOURCE_KEEPER_USERNAME,
	CARAVAN_USERNAME: CARAVAN_USERNAME,
	MINERALS_ALL: MINERALS_ALL,
	COMPOUNDS_ALL: COMPOUNDS_ALL,
	RETURN_CODES: RETURN_CODES,
	getOrSetMap: getOrSetMap,
	getMapWithDefault: getMapWithDefault,
	newDict: newDict,
	iterDict: iterDict,
	setOrDelete: setOrDelete,
	formatSI: formatSI,
	random: random,
	clamp: clamp,
	movingAverage: movingAverage,
	round: round,
	reduce: reduce,
	reduce_: reduce_,
	sum: sum,
	sum_: sum_,
	avg: avg,
	avg_: avg_,
	count: count,
	count_: count_,
	exists: exists,
	max: max,
	max_: max_,
	min: min,
	min_: min_,
	maxEntry: maxEntry,
	minEntry: minEntry,
	map: map,
	map_: map_,
	forEach: forEach,
	forEach_: forEach_,
	flatten: flatten,
	flatMap: flatMap,
	flatMap_: flatMap_,
	none: none,
	filter: filter,
	filter_: filter_,
	filterIs: filterIs,
	filterIs_: filterIs_,
	first: first,
	first_: first_,
	some: some,
	every: every,
	firstIs: firstIs,
	firstIs_: firstIs_,
	collect: collect,
	filterInPlace: filterInPlace,
	filterInPlace_: filterInPlace_,
	groupBy: groupBy,
	groupBy_: groupBy_,
	randomPick: randomPick,
	weightedRandomPick: weightedRandomPick,
	weightedRandomPick_: weightedRandomPick_,
	sort: sort,
	sort_: sort_,
	pipe: pipe,
	partial: partial,
	shuffle: shuffle,
	Invalid: Invalid,
	isValid: isValid,
	cache: cache,
	cacheForTicks: cacheForTicks,
	CPU_BUCKET_MAX: CPU_BUCKET_MAX,
	CPU_INTENT_COST: CPU_INTENT_COST,
	adjustedCPULimit: adjustedCPULimit,
	Profiler: Profiler,
	ROOM_SIZE: ROOM_SIZE$2,
	ROOM_MIN: ROOM_MIN,
	ROOM_MAX: ROOM_MAX,
	DIRECTION_ARROWS: DIRECTION_ARROWS,
	isExit: isExit,
	isInRoom: isInRoom,
	normalizePos: normalizePos$1,
	parseRoomName: parseRoomName,
	getRoomNameCoords: getRoomNameCoords,
	get RoomSectorKind () { return RoomSectorKind; },
	getRoomSectorKind: getRoomSectorKind,
	getRoomCenter: getRoomCenter,
	getChebyshevDist: getChebyshevDist,
	getManhattanDist: getManhattanDist,
	getEuclidDist: getEuclidDist,
	getDirectionTo: getDirectionTo,
	getToDirection: getToDirection,
	clampInRoom: clampInRoom,
	inRoomRange: inRoomRange,
	inRoomRangeXY: inRoomRangeXY,
	inRoomRangeArea: inRoomRangeArea,
	atRoomRange: atRoomRange,
	getDirectionsSorted: getDirectionsSorted,
	WorldPosition: WorldPosition,
	rangeTo: rangeTo,
	applyDistanceTransform: applyDistanceTransform,
	MATRIX_MAX: MATRIX_MAX,
	getRoomTerrainMatrix: getRoomTerrainMatrix,
	getRoomDistanceTransform: getRoomDistanceTransform$1,
	iterateMatrix: iterateMatrix$2,
	ACTION_BODYPART: ACTION_BODYPART,
	ACTION_RANGE: ACTION_RANGE,
	ACTION_RANGE_DICT: ACTION_RANGE_DICT,
	ACTION_POWER: ACTION_POWER,
	ACTION_POWER_DICT: ACTION_POWER_DICT,
	RANGED_MASS_ATTACK_POWER: RANGED_MASS_ATTACK_POWER,
	MOVE_FATIGUE_POWER: MOVE_FATIGUE_POWER,
	TERRAIN_MOVE_FATIGUE: TERRAIN_MOVE_FATIGUE,
	HITS_PER_PART: HITS_PER_PART,
	POWER_CREEP_HITS_PER_LEVEL: POWER_CREEP_HITS_PER_LEVEL,
	getBodyCost: getBodyCost,
	getBodyparts: getBodyparts,
	getActiveBodyparts: getActiveBodyparts,
	getBodypartsBoostEquivalent: getBodypartsBoostEquivalent,
	getActiveBodypartsBoostEquivalent: getActiveBodypartsBoostEquivalent,
	getMoveEfficiency: getMoveEfficiency,
	getBodypartsPower: getBodypartsPower,
	deleteDeadCreepsMemory: deleteDeadCreepsMemory,
	IN_RANGE: IN_RANGE,
	findGoToPath: findGoToPath,
	getGoToPath: getGoToPath,
	goTo: goTo,
	getRoom: getRoom,
	describeAdjacentRooms: describeAdjacentRooms,
	getRoomSourcesCapacity: getRoomSourcesCapacity,
	lookInRange: lookInRange,
	lookForInRange: lookForInRange,
	lookForMatrixInRange: lookForMatrixInRange,
	lookForStructureInRange: lookForStructureInRange,
	lookForStructureAt: lookForStructureAt,
	findRouteCached: findRouteCached,
	findRouteDist: findRouteDist,
	OBSTACLE_TYPES: OBSTACLE_TYPES,
	OBSTACLE_TYPES_DESTRUCTIBLE: OBSTACLE_TYPES_DESTRUCTIBLE,
	OBSTACLE_TYPES_NO_DESTRUCTIBLE: OBSTACLE_TYPES_NO_DESTRUCTIBLE,
	isObjectObstacle: isObjectObstacle,
	isTerrainWall: isTerrainWall,
	getIsSwamp: getIsSwamp,
	getIsTerrainWalkable: getIsTerrainWalkable,
	isTerrainWalkableAt: isTerrainWalkableAt,
	getExits: getExits,
	LAB_REACT_RANGE: LAB_REACT_RANGE,
	LAB_BOOST_RANGE: LAB_BOOST_RANGE,
	MARKET_MAX_DEALS_PER_TICK: MARKET_MAX_DEALS_PER_TICK,
	isStructureActive: isStructureActive,
	isStructureType: isStructureType,
	filterStructureType: filterStructureType,
	StructuresByType: StructuresByType,
	getStructuralLevel: getStructuralLevel,
	getRoadTicksToDestroy: getRoadTicksToDestroy,
	getTowerRangeRatio: getTowerRangeRatio,
	getGclCumulatedProgress: getGclCumulatedProgress,
	getGplCumulatedProgress: getGplCumulatedProgress,
	getControllerCumulatedProgress: getControllerCumulatedProgress,
	getLevelWithProgress: getLevelWithProgress
});

var require$$3 = /*@__PURE__*/getAugmentedNamespace(dist);

const {
    iterateMatrix: iterateMatrix$1,
    ROOM_SIZE: ROOM_SIZE$1,
    normalizePos
} = require$$3;

const findClosestValidRoomPosition$1 = (room, position, heuristic) => {
    const start = room.getPositionAt(position.x, position.y);
    if (start == null)
        return null;
    const frontier = [];
    frontier.push(start);
    const reached = new Set();
    reached.add(start.toString());
    while (frontier !== undefined && frontier.length > 0) {
        const current = frontier.shift();
        const objects = room.lookAt(current.x, current.y);
        const isValid = heuristic(objects);
        if (isValid)
            return current;
        const neighbours = getNeighbours(current);
        for (const neighbour of neighbours) {
            if (!reached.has(neighbour.toString())) {
                frontier.push(neighbour);
                reached.add(neighbour.toString());
            }
        }
    }
    return null;
};

const partitionCostMatrix$1 = (costMatrix, minCost) => {
    const contiguousRegions = [];
    const costMatrixIterator = iterateMatrix$1(costMatrix);
    const cellsAlreadyAssignedToRegions = new Set();
    for (const cell of costMatrixIterator) {
        if (cellsAlreadyAssignedToRegions.has(cell))
            continue;
        const region = [];
        const visited = new Set();
        const frontier = [];
        frontier.push(cell);
        visited.add(cell);
        while (frontier.length > 0) {
            const current = frontier.shift();
            if (current.v < minCost)
                continue;
            const neighbours = getNeighbours(current);
            for (const neighbour of neighbours) {
                const matrixNeighbour = {
                    x: neighbour.x,
                    y: neighbour.y,
                    v: costMatrix.get(neighbour.x, neighbour.y)
                };
                if (!visited.has(matrixNeighbour)) {
                    visited.add(matrixNeighbour);
                    frontier.push(matrixNeighbour);
                    if (matrixNeighbour.v >= minCost && !cellsAlreadyAssignedToRegions.has(matrixNeighbour)) {
                        region.push(matrixNeighbour);
                        cellsAlreadyAssignedToRegions.add(matrixNeighbour);
                    }
                }
            }
        }
        contiguousRegions.push(region);
    }
    return contiguousRegions;
};

const getNeighbours = (pos) => {
    const neighbours = [];
    const left = pos.x - 1;
    const top = pos.y - 1;
    const right = pos.x + 1;
    const bottom = pos.y + 1;
    if (left >= 0) 
        neighbours.push({ x: left, y: pos.y});
    if (left >= 0 && top >= 0)
        neighbours.push({ x: left, y: top });
    if (top >= 0)
        neighbours.push({ x: pos.x, y: top });
    if (top >= 0 && right < ROOM_SIZE$1)
        neighbours.push({ x: right, y: top });
    if (right < ROOM_SIZE$1)
        neighbours.push({ x: right, y: pos.y });
    if (right < ROOM_SIZE$1 && bottom < ROOM_SIZE$1)
        neighbours.push({ x: right, y: bottom });
    if (bottom < ROOM_SIZE$1)
        neighbours.push({ x: pos.x, y: bottom });
    if (bottom < ROOM_SIZE$1 && left >= 0)
        neighbours.push({ x: left, y: bottom });
    return neighbours;

};

var algorithms = {
    findClosestValidRoomPosition: findClosestValidRoomPosition$1,
    partitionCostMatrix: partitionCostMatrix$1
};

const TARGET_TTL$1 = 300;

class BaseCreep$1 {
    constructor(creep) {
        this.creep = creep;
    }

    findClosestEnergySink() {
        return this.creep.room
            .find(FIND_MY_STRUCTURES)
            .filter(this.isEnergySink)
            .filter(this.hasCapacity)
            .sort(this.closestToMe)
        [0]
    }

    findClosestFreeSource() {
        return this.creep.room.find(FIND_SOURCES)
            .filter(this.isFree)
            .sort(this.closestToMe)
        [0]
    }

    closestToMe() {
        return (a, b) => {
            return this.creep.pos.getRangeTo(a.pos) -
                this.creep.pos.getRangeTo(b.pos)
        }
    }

    isFree(object) {
        const memory = object.room.memory;
        const occupancy = memory.occupancy;
        if (occupancy === undefined)
            return true
        return occupancy[object.id] < 3
    }

    isEnergySink(structure) {
       return structure instanceof StructureSpawn ||
            structure instanceof StructureContainer ||
            structure instanceof StructureExtension ||
            structure instanceof StructureTower
    }

    hasCapacity(structure) {
        return structure.store.getUsedCapacity(RESOURCE_ENERGY) <
            structure.store.getCapacity(RESOURCE_ENERGY);
    }
}

var baseCreep = {
    TARGET_TTL: TARGET_TTL$1,
    BaseCreep: BaseCreep$1
};

const { BaseCreep, TARGET_TTL } = baseCreep;

class Harvester$1 extends BaseCreep {
    run() {
		if (this.creep.memory.working) {
            const target = this.refreshTarget();
            const workResult = this.creep.transfer(target, RESOURCE_ENERGY);
            if (workResult === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target);
            } else if (workResult === ERR_NOT_ENOUGH_RESOURCES) {
                this.creep.memory.working = false;
            }
		} else {
			if (
				this.creep.store.getUsedCapacity(RESOURCE_ENERGY) ===
				this.creep.store.getCapacity(RESOURCE_ENERGY)
			) {
				this.creep.memory.working = true;
                this.refreshTarget();
			} else {
				const closestSource = this.findClosestFreeSource();
				if (closestSource) {
                    if (this.creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                        this.creep.moveTo(closestSource);
                    }
                }
			}
		}
    }

    refreshTarget () {
        const targetIdUpdateTick = this.creep.memory.targetIdUpdateTick;
        const currentTick = Game.time;
        const targetId = this.creep.memory.targetId;
        let target = Game.getObjectById(targetId);
        if (targetIdUpdateTick === undefined ||
            currentTick - targetIdUpdateTick >= TARGET_TTL ||
            target === undefined
        ) {
            target = this.findClosestEnergySink();
            this.creep.memory.targetId = target.id;
            this.creep.memory.targetIdUpdateTick = Game.time;
        }
        return target;
    };
}

var harvester = {
	Harvester: Harvester$1,
};

function creeps() {
    const creeps = [];
    for (const name in Game.creeps) {
        const maybeCreep = Game.creeps[name];
        if (maybeCreep != null) {
            creeps.push(maybeCreep);
        }
    }
    return creeps;
}

function rooms() {
    const rooms = [];
    for (const name in Game.rooms) {
        const maybeRoom = Game.rooms[name];
        if (maybeRoom != null) {
            rooms.push(maybeRoom);
        }
    }
    return rooms;
}

function room$2(roomName) { 
   return Game.rooms[roomName]; 
}

var utils$1 = {
    creeps,
    rooms,
    room: room$2
};

const { room: room$1 } = utils$1;

class Upgrader$1 {
    constructor(creep) {
        this.creep = creep;

        this.run = () => {
            if (creep.memory.working) {
                const controller = creep.room.controller;
                if (controller) {
                    const workResult = creep.upgradeController(controller);
                    if (workResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(controller);
                    }
                    else if (workResult === ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.working = false;
                    }
                }
            }
            else {
                if (creep.store.getUsedCapacity(RESOURCE_ENERGY) ===
                    creep.store.getCapacity(RESOURCE_ENERGY)) {
                    creep.memory.working = true;
                }
                else {
                    const creepRoom = room$1(creep.memory.room);
                    const closestSource = creepRoom
                        .find(FIND_SOURCES)
                        .sort((sourceA, sourceB) => {
                            return (creep.pos.getRangeTo(sourceA.pos) -
                                creep.pos.getRangeTo(sourceB.pos));
                        })[0];
                    if (closestSource) {
                        if (creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(closestSource);
                        }
                    }
                }
            }
        };
    }
}

var upgrader = {
    Upgrader: Upgrader$1
};

const { room } = utils$1;

class Builder$1 {
    constructor(creep) {
        this.creep = creep;

        this.run = () => {
            if (creep.memory.working) {
                const closestConstructionSite = creep.room
                    .find(FIND_CONSTRUCTION_SITES)
                    .sort(constructionSite => {
                        return creep.pos.getRangeTo(constructionSite.pos);
                    })[0];
                if (closestConstructionSite) {
                    const workResult = creep.build(closestConstructionSite);
                    if (workResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestConstructionSite);
                    }
                    else if (workResult === ERR_NOT_ENOUGH_RESOURCES) {
                        creep.memory.working = false;
                    }
                } else {
                    creep.suicide();
                }
            }
            else {
                if (creep.store.getUsedCapacity(RESOURCE_ENERGY) ===
                    creep.store.getCapacity(RESOURCE_ENERGY)) {
                    creep.memory.working = true;
                }
                else {
                    const creepRoom = room(creep.memory.room);
                    const closestSource = creepRoom
                        .find(FIND_SOURCES)
                        .sort((sourceA, sourceB) => {
                            return (creep.pos.getRangeTo(sourceA.pos) -
                                creep.pos.getRangeTo(sourceB.pos));
                        })[0];
                    if (closestSource) {
                        if (creep.harvest(closestSource) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(closestSource);
                        }
                    }
                }
            }
        };
    }
}

var builder = {
    Builder: Builder$1
};

class Scout$1 {
    constructor(creep) {
        this.creep = creep;

        this.run = () => {
            if (creep.memory.working) {
                if (creep.room.controller) {
                    if (creep.reserveController(creep.room.controller) ===
                        ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller);
                    }
                }
            }
            else {
                if (creep.room.name !== creep.memory.room) {
                    if (creep.room.controller) {
                        creep.moveTo(creep.room.controller);
                        creep.memory.working = true;
                        creep.memory.room = creep.room.name;
                    }
                    else {
                        this.moveToFirstExit(creep);
                    }
                }
                else {
                    this.moveToFirstExit(creep);
                }
            }
        };

        this.moveToFirstExit = () => {
            return false;
        };
    }
}

var scout = {
    Scout: Scout$1
};

const { Harvester } = harvester;
const { Upgrader } = upgrader;
const { Builder } = builder;
const { Scout } = scout;

const CREEP_ROLE_HARVESTER$1 = 0;
const CREEP_ROLE_UPGRADER$1 = 1;
const CREEP_ROLE_BUILDER$1 = 2;
const CREEP_ROLE_SCOUT$1 = 3;

const creepData$1 = [
    {
        role: CREEP_ROLE_HARVESTER$1,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Harvester
    },
    {
        role: CREEP_ROLE_UPGRADER$1,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Upgrader
    },
    {
        role: CREEP_ROLE_BUILDER$1,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Builder
    },
    {
        role: CREEP_ROLE_SCOUT$1,
        bodyParts: [WORK, CARRY, MOVE],
        prototype: Scout
    }
];

var creepData_1 = {
    CREEP_ROLE_HARVESTER: CREEP_ROLE_HARVESTER$1,
    CREEP_ROLE_UPGRADER: CREEP_ROLE_UPGRADER$1,
    CREEP_ROLE_BUILDER: CREEP_ROLE_BUILDER$1,
    CREEP_ROLE_SCOUT: CREEP_ROLE_SCOUT$1,
    creepData: creepData$1
};

const {
	findClosestValidRoomPosition,
	partitionCostMatrix,
} = algorithms;
const {
	CREEP_ROLE_BUILDER,
	CREEP_ROLE_HARVESTER,
	CREEP_ROLE_SCOUT,
	CREEP_ROLE_UPGRADER,
	creepData,
} = creepData_1;
const _creeps = utils$1.creeps;

const {
	getRoomDistanceTransform,
	iterateMatrix,
	ROOM_SIZE,
} = require$$3;

const MAX_HARVESTERS = 12;
const MAX_UPGRADERS = 3;
const MAX_BUILDERS = 3;
const MAX_SCOUTS = 0;
const ROOM_DISTANCE_TRANSFORM_TTL = 60;

class ManagedRoom$1 {
	constructor(room) {
		this.room = room;
		this.spawn = this.room.find(FIND_MY_SPAWNS)[0];
		this.controller = room.controller;
		this.sources = room.find(FIND_SOURCES);
		this.creeps = _creeps().filter((creep) => {
			return creep.memory.room === room.name;
		});
		const creepsOfRole = (role) => {
			return this.creeps
				.filter((creep) => {
					return creep.memory.role === role;
				})
				.map((creep) => {
					return new creepData[role].prototype(creep);
				});
		};
		this.harvesters = creepsOfRole(CREEP_ROLE_HARVESTER);
		this.upgraders = creepsOfRole(CREEP_ROLE_UPGRADER);
		this.builders = creepsOfRole(CREEP_ROLE_BUILDER);
		this.scouts = creepsOfRole(CREEP_ROLE_SCOUT);
	}

	run() {
		this.refreshRoomDistanceTransform();
		this.planStructures();
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_HARVESTER, MAX_HARVESTERS);
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_UPGRADER, MAX_UPGRADERS);
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_BUILDER, MAX_BUILDERS);
		this.spawnRoleIfNotMaxxed(CREEP_ROLE_SCOUT, MAX_SCOUTS);
		for (const harvester of this.harvesters) harvester.run();
		for (const upgrader of this.upgraders) upgrader.run();
		for (const builder of this.builders) builder.run();
		for (const scout of this.scouts) scout.run();
        this.logRoomInfo();
	}

	spawnRoleIfNotMaxxed(role, max) {
		let numberOfCreepsInRole = 0;
		if (role === CREEP_ROLE_HARVESTER)
			numberOfCreepsInRole = this.harvesters.length;
		else if (role === CREEP_ROLE_UPGRADER)
			numberOfCreepsInRole = this.upgraders.length;
		else if (role === CREEP_ROLE_BUILDER)
			numberOfCreepsInRole = this.builders.length;
		else if (role === CREEP_ROLE_SCOUT)
			numberOfCreepsInRole = this.scouts.length;
		if (numberOfCreepsInRole < max) {
			this.spawn.spawnCreep(creepData[role].bodyParts, Game.time.toString(), {
				memory: {
					room: this.room.name,
					working: false,
					role: role,
				},
			});
		}
	}

	hasNeedForRole(role) {
		if (role === CREEP_ROLE_HARVESTER)
			return this.harvesters.length < MAX_HARVESTERS;
		if (role === CREEP_ROLE_UPGRADER)
			return this.upgraders.length < MAX_UPGRADERS;
		if (role === CREEP_ROLE_BUILDER) {
            const hasLessThanMaxBuilders =  
                this.builders.length < MAX_BUILDERS;
            const hasConstructionSites = 
                this.room.find(FIND_CONSTRUCTION_SITES).length > 0;
            return hasLessThanMaxBuilders && hasConstructionSites;
		}
        if (role === CREEP_ROLE_SCOUT)
			return this.scouts.length < MAX_SCOUTS;
	}

	findClosestValidConstructionSite(pos) {
		return findClosestValidRoomPosition(this.room, pos, (objects, current) => {
			for (const object of objects) {
				if (object.type === LOOK_CREEPS) return false;
				if (object.type === LOOK_STRUCTURES) return false;
				if (object.type === LOOK_CONSTRUCTION_SITES)
					if (object.constructionSite) return false;
				if (object.type === LOOK_TERRAIN)
					if (object.terrain === "wall" || object.terrain === "swamp")
						return false;
				if (this.spawn.pos.getRangeTo(current) <= 1) return falsef;
				return true;
			}
		});
	}

	planStructures() {
		this.planPaths();
		//this.largestContiguousArea(room);
	}

	planPaths() {
		const pathsToSources = this.sources.map((source) => {
			return PathFinder.search(this.spawn.pos, source.pos).path;
		});
		for (const path of pathsToSources) {
			for (const roomPosition of path) {
				this.room.createConstructionSite(
					roomPosition.x,
					roomPosition.y,
					STRUCTURE_ROAD,
				);
			}
		}
	}

	largestContiguousArea() {
		const roomDistanceTransform = this.refreshRoomDistanceTransform(this.room);
		const regions = partitionCostMatrix(roomDistanceTransform, 3);
		for (const region of regions) {
			for (const cell in region) {
				this.room.visual.text(cell.v, cell.x, cell.y, {
					color: "white",
					font: 0.25,
				});
			}
		}
	}

	refreshRoomDistanceTransform() {
		const roomDistanceTransformUpdateTick =
			this.room.memory.roomDistanceTransformUpdateTick;
		const currentTick = Game.time;
		const roomDistanceTransform = this.room.memory.roomDistanceTransform;
		if (
			roomDistanceTransformUpdateTick === undefined ||
			currentTick - roomDistanceTransformUpdateTick >=
				ROOM_DISTANCE_TRANSFORM_TTL ||
			roomDistanceTransform === undefined
		) {
			const newRoomDistanceTransform = getRoomDistanceTransform(this.room.name);
			this.room.memory.roomDistanceTransform =
				newRoomDistanceTransform.serialize();
			this.room.memory.roomDistanceTransformUpdateTick = currentTick;
			return newRoomDistanceTransform;
		}
		return PathFinder.CostMatrix.deserialize(roomDistanceTransform);
	}

	visualiseRoomDistanceTransform() {
		const roomDistanceTransform = this.refreshRoomDistanceTransform(this.room);
		const iterator = iterateMatrix(roomDistanceTransform);
		for (const cell of iterator) {
			this.room.visual.text(cell.v, cell.x, cell.y);
		}
	}

    logRoomInfo() {
        console.log(`harvesters: ${this.harvesters.length}`);
        console.log(`upgraders: ${this.upgraders.length}`);
        console.log(`builders: ${this.builders.length}`);
        console.log(`scouts: ${this.scouts.length}`);
    }
}

var roomManager = {
	ManagedRoom: ManagedRoom$1,
};

const { ManagedRoom } = roomManager;
const utils = utils$1;

var loop = main.loop = () => {
	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			delete Memory.creeps[name];
		}
	}
	const room = utils.rooms()[0];
	const managedRoom = new ManagedRoom(room);
	managedRoom.run();
};

exports.default = main;
exports.loop = loop;
