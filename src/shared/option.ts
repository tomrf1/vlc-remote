interface Some<A> {
    type: 'some';
    value: A;
}

interface None {
    type: 'none';
}

type Option<A> = Some<A> | None;

const some = <A>(a: A): Option<A> => ({ type: 'some', value: a });
const none: None = { type: 'none' };

const flatMap = <A,B>(o: Option<A>) => (f: (a: A) => Option<B>): Option<B> =>
    o.type === 'some' ? f(o.value) : o;

const map = <A,B>(o: Option<A>) => (f: (a: A) => B): Option<B> => 
    flatMap<A,B>(o)((a: A) => some(f(a)));

const fold = <A,B>(o: Option<A>) => (f: (a: A) => B, g: () => B): B =>
    o.type === 'some' ? f(o.value) : g();

const isEmpty = <A>(o: Option<A>): o is None => o.type === 'none';
const nonEmpty = <A>(o: Option<A>): o is Some<A> => o.type === 'some';

export {
    Option,
    some,
    none,
    flatMap,
    map,
    fold,
    isEmpty,
    nonEmpty,
}
