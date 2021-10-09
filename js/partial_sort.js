function Bisect(items, x, comparator, lo, hi) {
    if (typeof(lo) == 'undefined')
        lo = 0

    if (typeof(hi) == 'undefined')
        hi = items.length

    while (lo < hi) {
        let mid = Math.floor((lo + hi) / 2)

        if (comparator(x, items[mid]) < 0) {
            hi = mid
        }
        else {
            lo = mid + 1
        }
    }

    return lo;
}

function Insort(items, x, comparator) {
    items.splice(Bisect(items, x, comparator), 0, x)
}

function PartialSort(items, k, comparator) {
    let smallest = []

    for (let i = 0, len = items.length; i < len; ++i) {
        let item = items[i]

        if (smallest.length < k || comparator(item, smallest[smallest.length - 1]) < 0) {
            Insort(smallest, item, comparator)

            if (smallest.length > k) {
                smallest.splice(k, 1)
            }
        }
    }

    return smallest
}
