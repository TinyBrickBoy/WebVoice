type LoadingValue<V> = {
    resolve: (val: V) => void,
    reject: (error?: any) => void,
}

export class CachedMap<K, V> {

    private readonly delegate = new Map<K, V>();
    private readonly loading = new Map<K, LoadingValue<V>[]>();

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
            return Promise.resolve(val);
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
