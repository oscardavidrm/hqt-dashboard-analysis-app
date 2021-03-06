import {Artisan, Product, Location} from '../../../database/models';
import authenticated from '../../middleware/authenticated';
import {User, ProductType, Transaction} from '../../../database/models';

const productMutations = {
  product: authenticated(async (_, args) => {
    const product = new Product({...args.product});
    const artisan = await Artisan.findById(product.artisan).select(
      'code products'
    );
    const productType = await ProductType.findOneAndUpdate(
      {_id: product.productType},
      {$inc: {count: 1}},
      {new: false}
    ).select('_id code count');

    if (!artisan) throw new Error('Artisan does not exists!');
    if (!productType) throw new Error('Product Type does not exists!');

    product.code =
      artisan.code.toString() +
      artisan.products.length.toString() +
      '-' +
      productType.code.toString() +
      '-' +
      productType.count.toString();

    artisan.products.push(product._id);

    try {
      await artisan.save();
      await product.save();
      return product;
    } catch (e) {
      return e;
    }
  }),
  sell: authenticated(async (_, args) => {
    try {
      const oldProduct = await Product.findById(args.product.id);
      const seller = await User.findOne({username: args.product.seller}).select(
        'id soldProducts'
      );

      if (!oldProduct || oldProduct.seller)
        throw new Error('Product is not available!');
      if (!seller) throw new Error('Seller is not registered!');

      const product = await Product.findOneAndUpdate(
        {_id: args.product.id},
        {...args.product, seller},
        {new: true}
      ).populate('seller');

      const transaction = new Transaction({
        type: 'IN',
        paymentMethod: product.paymentMethod,
        name: `Venta producto: ${product.productName}`,
        description: `Transacción en inventario por ${product.seller.username}`,
        amount: product.retailPrice,
        date: product.dateSold,
        product: product.id,
      });

      seller.soldProducts.push(product.id);

      await transaction.save();
      await seller.save();

      return product;
    } catch (e) {
      throw new Error(e);
    }
  }),
  receive: authenticated(async (_, args) => {
    try {
      const oldProduct = await Product.findById(args.product.id);
      const location = await Location.findById(args.product.location);

      if (!oldProduct) throw new Error('Product is not available!');
      if (!location) throw new Error('Location is not registered!');

      const product = await Product.findOneAndUpdate(
        {_id: args.product.id},
        {location}
      );

      return product;
    } catch (e) {
      throw new Error(e);
    }
  }),
  return: authenticated(async (_, args) => {
    try {
      const product = await Product.findOneAndUpdate(
        {_id: args.product.id},
        {
          $unset: {seller: '', paymentMethod: '', dateSold: ''},
        },
        {new: false}
      );

      const seller = await User.findById(product.seller).select('soldProducts');
      await seller.soldProducts.remove(product.id);

      if (!product) throw new Error('Product is not available!');
      if (!seller) throw new Error('Seller is not available!');

      await Transaction.findOneAndRemove({product: product.id});
      await seller.save();

      return product;
    } catch (e) {
      throw new Error(e);
    }
  }),
};

export default productMutations;
