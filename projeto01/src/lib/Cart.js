import _ from "lodash";
import Dinero from "dinero.js";

const Money = Dinero;

Money.defaultCurrency = "BRL";
Money.defaultPrecision = 2;

const calculatePercentageDiscount = (amount, { condition, quantity }) => {
  if (condition.percentage && quantity > condition.minimum) {
    return amount.percentage(condition.percentage);
  }

  return Money({ amount: 0 });
};

const calculateQuantityDiscount = (amount, { condition, quantity }) => {
  const isEven = quantity % 2 === 0;

  if (condition.quantity && quantity > condition.quantity) {
    return amount.percentage(isEven ? 50 : 40);
  }

  return Money({ amount: 0 });
};

const calculateDiscount = (amount, quantity, condition) => {
  const list = Array.isArray(condition) ? condition : [condition];

  const [higherDiscount] = list
    .map((cond) => {
      if (cond.percentage) {
        return calculatePercentageDiscount(amount, {
          condition: cond,
          quantity,
        }).getAmount();
      }

      if (cond.quantity) {
        return calculateQuantityDiscount(amount, {
          condition: cond,
          quantity,
        }).getAmount();
      }
    })
    .sort((a, b) => b - a);

  return Money({ amount: higherDiscount });
};

export default class Cart {
  items = [];

  add(item) {
    if (_.find(this.items, { product: item.product })) {
      _.remove(this.items, { product: item.product });
    }
    this.items.push(item);
  }

  remove(item) {
    _.remove(this.items, { product: item });
  }

  getTotal() {
    return this.items.reduce((acc, { condition, product, quantity }) => {
      const amount = Money({ amount: quantity * product.price });
      let discount = Money({ amount: 0 });

      if (condition) {
        discount = calculateDiscount(amount, quantity, condition);
      }

      return acc.add(amount).subtract(discount);
    }, Money({ amount: 0 }));
  }

  checkout() {
    const { total, items } = this.summary();

    this.items = [];

    return {
      total,
      items,
    };
  }

  summary() {
    const total = this.getTotal();
    const formatted = total.toFormat("$0,0.00");
    const items = this.items;

    return {
      total: total.getAmount(),
      formatted: formatted,
      items,
    };
  }
}
