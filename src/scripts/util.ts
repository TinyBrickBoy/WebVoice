export function getMapValues<V>(map: Map<any, V>): V[] {
    const array: V[] = new Array(map.size);
    map.forEach(value => array.push(value));
    return array;
}