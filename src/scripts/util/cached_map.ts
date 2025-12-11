type LoadingValue<V> = {
    resolve: (val: V) => void,
    reject: (error?: any) => void,
}

type ExpiringValue<V> = {
    value: V,
    expiry: bigint,
}

export class CachedMap<K, V> {

    private readonly delegate = new Map<K, ExpiringValue<V>>();
    private readonly loading = new Map<K, LoadingValue<V>[]>();
    private readonly cacheDuration: bigint;

    constructor(cacheDuration: bigint) {
        this.cacheDuration = cacheDuration;
    }

    public hasCached(key: K) {
        return this.delegate.has(key);
    }

    public getIfCached(key: K) {
        return this.delegate.get(key);
    }

    public getOrLoad(key: K, load: (key: K) => Promise<V>) {
        // check if cached
        const val = this.delegate.get(key);
        if (val !== undefined) {
            // check the entry hasn't expired yet
            if (val.expiry > Date.now()) {
                return Promise.resolve(val.value);
            }
            // delete from delegate cache map
            this.delegate.delete(key);
        }
        // check if loading
        const loadingVals = this.loading.get(key);
        if (loadingVals !== undefined) {
            return new Promise<V>((resolve, reject) => {
                loadingVals.push({resolve, reject});
            });
        }
        // set loading
        const newLoadingVals: LoadingValue<V>[] = [];
        this.loading.set(key, newLoadingVals);
        // fetch asynchronously
        return new Promise<V>(async (resolve, reject) => {
            try {
                const val = await load(key);
                // immediately save in map with set expiry
                this.delegate.set(key, {value: val, expiry: BigInt(Date.now()) + this.cacheDuration});
                // inform everyone about success!
                newLoadingVals.forEach(loader => loader.resolve(val));
                resolve(val);
            } catch (error) {
                // inform everyone about failure!
                newLoadingVals.forEach(loader => loader.reject(error));
                reject(error);
            } finally {
                this.loading.delete(key);
            }
            return load(key)
                .then(val => {
                    return val;
                })
                .finally(() => this.loading.delete(key));
        });
    }
}
