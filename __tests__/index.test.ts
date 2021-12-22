import { reactive, effect } from '../src';

import { forMocks } from './util';

const r = reactive({
	a: 1,
	b: 2,
	c: 3
});

const update = () => {
	r.a++;
	r.b++;
	r.c++;
};

describe('run effect', () => {
	it('runs an effect when initialized, regardless of any dependencies', () => {
		const mock = jest.fn();

		effect(mock);
		expect(mock).toHaveBeenCalledTimes(1);
	});

	it('reruns the effect when a reactive property dependency has been mutated', () => {
		const mock = jest.fn(() => {
			r.a;
		});

		effect(mock);
		expect(mock).toHaveBeenCalledTimes(1);

		r.a = 2221;
		expect(mock).toHaveBeenCalledTimes(2);
	});

	it('only runs effects which depend on a reactive property', () => {
		const mock = jest.fn(() => {});
		const mock2 = jest.fn(() => {
			r.a;
		});
		const mock3 = jest.fn(() => {
			r.c;
		});

		effect(mock);
		expect(mock).toHaveBeenCalledTimes(1);

		update();
		expect(mock).toHaveBeenCalledTimes(1);
		effect(mock2);
		expect(mock2).toHaveBeenCalledTimes(1);

		update();
		expect(mock).toHaveBeenCalledTimes(1);
		expect(mock2).toHaveBeenCalledTimes(2);
		effect(mock3);

		update();
		expect(mock).toHaveBeenCalledTimes(1);
		expect(mock2).toHaveBeenCalledTimes(3);
		expect(mock3).toHaveBeenCalledTimes(2);
	});

	it('runs an effect for each property mutation', () => {
		const mock = jest.fn(() => {
			r.a;
			r.b;
		});
		effect(mock);
		expect(mock).toHaveBeenCalledTimes(1);
		update();
		expect(mock).toHaveBeenCalledTimes(3);
	});

	it('mutating the dependency inside the effect does not trigger the effect', () => {
		const mock = jest.fn(() => {
			update();
		});

		effect(mock);
		expect(mock).toHaveBeenCalledTimes(1);

		update();
		expect(mock).toHaveBeenCalledTimes(4);
	});

	it('triggers effects on nested object mutations', () => {
		const r2 = reactive({
			a: 1,
			b: {
				x: {
					x: 1,
					y: 2
				},
				y: 2
			}
		});

		const mock = jest.fn(() => {
			r2.b.x.y;
		});

		effect(mock);
		expect(mock).toHaveBeenCalledTimes(1);

		r2.b.x.y = 12;
		expect(mock).toHaveBeenCalledTimes(2);
	});

	it('tracks and runs multiple effects', () => {
		const r1 = reactive({
			x: 1,
			y: 2,
			z: {
				a: 1,
				b: 2
			}
		});

		const r2 = reactive({
			c: 3,
			d: 4
		});

		const mock1 = jest.fn();
		const mock2 = jest.fn();
		const mock3 = jest.fn(() => {
			t3 += r1.x + r1.y + r2.c + r2.d + r1.z.a + r1.z.b;
		});

		let t1 = 0;
		let t2 = 0;
		let t3 = 0;

		effect(() => {
			t1 += r1.x;
			mock1();
		});

		effect(() => {
			t2 += r2.c + r1.y;
			mock2();
		});

		effect(() => {
			mock3();
		});

		expect(mock1).toHaveBeenCalledTimes(1);
		expect(mock2).toHaveBeenCalledTimes(1);
		expect(mock3).toHaveBeenCalledTimes(1);

		// t1 = 1 (initial effect run)
		// r1.x = 2, t1 = (1 + 2) = 3
		// t2 = 3 (initial effect run)
		r1.x++;
		r2.c += 22;
		r1.x++;
		r1.y += 12;
		r2.d += 2;
		r1.z.a += 12;
		r1.z.b++;

		expect(mock1).toHaveBeenCalledTimes(3);
		expect(mock2).toHaveBeenCalledTimes(3);
		expect(mock3).toHaveBeenCalledTimes(8);

		expect(t1).toBe(6);
		expect(t2).toBe(71);
		expect(t3).toBe(327);
	});

	it('handles branching', () => {
		const mock1 = jest.fn();
		const mock2 = jest.fn();

		const r = reactive({
			price: 1,
			quantity: 2,
			meta: {
				uuid: '<>',
				inStock: false
			}
		});

		let total = 0;

		effect(() => {
			if (r.meta.inStock) {
				total += r.price;
				mock1();
			} else {
				total += r.quantity;
				mock2();
			}
		});

		// second effect to prove we don't have crossed dependencies
		effect(() => {
			r.quantity;
		});

		expect(mock1).toHaveBeenCalledTimes(0);
		expect(mock2).toHaveBeenCalledTimes(1);
		expect(total).toBe(2);

		r.price++;

		expect(mock1).toHaveBeenCalledTimes(0);
		expect(mock2).toHaveBeenCalledTimes(1);
		expect(total).toBe(2);

		r.quantity += 3;

		expect(mock1).toHaveBeenCalledTimes(0);
		expect(mock2).toHaveBeenCalledTimes(2);
		expect(total).toBe(7);

		// now we trigger the `if` branch
		r.meta.inStock = true;

		expect(mock1).toHaveBeenCalledTimes(1);
		expect(mock2).toHaveBeenCalledTimes(2);
		expect(total).toBe(9);

		r.meta.inStock = false;

		expect(mock1).toHaveBeenCalledTimes(1);
		expect(mock2).toHaveBeenCalledTimes(3);
		expect(total).toBe(14);

		r.meta.inStock = true;

		expect(mock1).toHaveBeenCalledTimes(2);
		expect(mock2).toHaveBeenCalledTimes(3);
		expect(total).toBe(16);

		r.price++;

		expect(mock1).toHaveBeenCalledTimes(3);
		expect(mock2).toHaveBeenCalledTimes(3);
		expect(total).toBe(19);
	});

	it('handles nested reactive properties', () => {
		const mocks = Array.from({ length: 10 }, jest.fn);

		const r = reactive({
			a: false,
			x: {
				y: {
					z: 11
				}
			},
			y: {
				z: 12
			},
			z: {
				x: ['a'],
				y: ['b']
			}
		});

		effect(() => {
			mocks[0]();

			if (r.x.y.z === 12) {
				// eslint-disable-next-line no-console
				console.log('trigger');
			}

			if (r.a) {
				mocks[1]();

				// @ts-expect-error
				if (r.x.k) {
					mocks[2]();

					if (r.z.x[0] === 'r') {
						mocks[3]();

						if (r.x.y.z > 20) {
							mocks[4]();
						}
					}
				}
			}

			if (r.z.x.length > 1) {
				mocks[5]();

				if (r.a) {
					mocks[6]();

					if (typeof r.y.z == 'string') {
						mocks[7]();
					}
				} else {
					mocks[8]();
				}
			}

			if (r.z.y.length > 1 && r.a) {
				mocks[9]();
			}
		});

		expect(mocks[0]).toHaveBeenCalledTimes(1);

		forMocks(1, mocks.length, (n) => {
			expect(mocks[n]).toHaveBeenCalledTimes(0);
		});

		r.a = true;

		expect(mocks[0]).toHaveBeenCalledTimes(2);
		expect(mocks[1]).toHaveBeenCalledTimes(1);

		forMocks(2, mocks.length, (n) => {
			expect(mocks[n]).toHaveBeenCalledTimes(0);
		});

		// it handles reacting newly added properties
		// @ts-expect-error
		r.x.k = true;

		expect(mocks[0]).toHaveBeenCalledTimes(3);
		expect(mocks[1]).toHaveBeenCalledTimes(2);
		expect(mocks[2]).toHaveBeenCalledTimes(1);

		forMocks(3, mocks.length, (n) => {
			expect(mocks[n]).toHaveBeenCalledTimes(0);
		});

		// setting inner branch `true`, next line will set the outer to true - both should evaluate
		r.x.y.z = 21;
		// it handles array indices mutations
		r.z.x[0] = 'r';

		expect(mocks[0]).toHaveBeenCalledTimes(5);
		expect(mocks[1]).toHaveBeenCalledTimes(4);
		expect(mocks[2]).toHaveBeenCalledTimes(3);
		expect(mocks[3]).toHaveBeenCalledTimes(1);
		expect(mocks[4]).toHaveBeenCalledTimes(1);

		forMocks(5, mocks.length, (n) => {
			expect(mocks[n]).toHaveBeenCalledTimes(0);
		});

		// @ts-expect-error
		r.y.z = 't';

		r.z.x[1] = 'x';
		r.z.x[1] = 'z';
		r.z.x[1] = 'q';

		// switch to else cond
		r.a = false;

		r.x.y.z = 12;
		r.x.y.z = 12;
		r.x.y.z = 12;

		r.a = true;

		r.z.y.length = 12;

		expect(mocks[0]).toHaveBeenCalledTimes(10);
		expect(mocks[1]).toHaveBeenCalledTimes(7);
		expect(mocks[2]).toHaveBeenCalledTimes(6);
		expect(mocks[3]).toHaveBeenCalledTimes(4);
		expect(mocks[4]).toHaveBeenCalledTimes(2);
		expect(mocks[5]).toHaveBeenCalledTimes(5);
		expect(mocks[6]).toHaveBeenCalledTimes(3);
		expect(mocks[7]).toHaveBeenCalledTimes(3);
		expect(mocks[8]).toHaveBeenCalledTimes(2);
		expect(mocks[9]).toHaveBeenCalledTimes(1);
	});

	it('handles effects with no dependencies', () => {
		const mock = jest.fn();

		effect(() => {
			mock();
		});

		expect(mock).toHaveBeenCalledTimes(1);
	});

	it('handles effects with no immediately available dependencies', () => {
		const mock = jest.fn();
		const mock2 = jest.fn();

		const r = reactive({
			x: 1,
			y: 1
		});

		effect(() => {
			if (r.x > 1) {
				mock();
			}

			mock2();
		});

		r.y = 12;

		expect(mock).toHaveBeenCalledTimes(0);
		expect(mock2).toHaveBeenCalledTimes(1);
	});
});