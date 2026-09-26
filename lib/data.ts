import { Product } from './types'

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Butterfly',
    description: 'Sugar-glazed bread folded into wings, soft in the middle with lightly crisp edges.',
    price: 5.00,
    category: 'pastry',
    image: '/images/butterfly.jpg',
    featured: true,
    stock: 40,
    ingredients: ['Flour', 'Butter', 'Sugar', 'Yeast', 'Milk', 'Eggs']
  },
  {
    id: '2',
    name: 'Coco German',
    description: 'Crisp German-style roll with a sweet toasted coconut filling.',
    price: 5.00,
    category: 'pastry',
    image: '/images/coco_german.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Coconut', 'Sugar', 'Butter', 'Yeast']
  },
  {
    id: '3',
    name: 'Coco Roll',
    description: 'Soft bread rolled around sweetened shredded coconut and baked golden.',
    price: 5.00,
    category: 'pastry',
    image: '/images/coco_roll.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Coconut', 'Sugar', 'Butter', 'Milk', 'Yeast']
  },
  {
    id: '4',
    name: 'Star Bread (Putok)',
    description: 'The classic putok — dense, faintly salty bread that cracks open into a star as it bakes.',
    price: 5.00,
    category: 'bread',
    image: '/images/star_bread__putok.jpg',
    featured: true,
    stock: 50,
    ingredients: ['Flour', 'Water', 'Sugar', 'Salt', 'Yeast']
  },
  {
    id: '5',
    name: 'Ube Pandesal',
    description: 'Purple yam pandesal rolled in breadcrumbs, soft and lightly sweet straight from the oven.',
    price: 5.00,
    category: 'bread',
    image: '/images/ube_pandesal.jpg',
    featured: true,
    stock: 60,
    ingredients: ['Flour', 'Ube halaya', 'Sugar', 'Milk', 'Butter', 'Yeast', 'Breadcrumbs']
  },
  {
    id: '6',
    name: 'Bicho',
    description: 'Twisted fried dough rolled in sugar, crisp outside and chewy within.',
    price: 6.00,
    category: 'pastry',
    image: '/images/bicho.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Sugar', 'Yeast', 'Eggs', 'Cooking oil']
  },
  {
    id: '7',
    name: 'Custard Bread',
    description: 'Pillowy bun filled with smooth vanilla custard.',
    price: 5.00,
    category: 'bread',
    image: '/images/custard_bread.jpg',
    featured: true,
    stock: 40,
    ingredients: ['Flour', 'Eggs', 'Milk', 'Sugar', 'Butter', 'Vanilla']
  },
  {
    id: '8',
    name: 'Ensaymada',
    description: 'Brioche-soft coil brushed with butter, topped with sugar and grated cheese.',
    price: 5.00,
    category: 'pastry',
    image: '/images/ensaymada.jpg',
    featured: true,
    stock: 40,
    ingredients: ['Flour', 'Butter', 'Egg yolks', 'Sugar', 'Cheese', 'Milk']
  },
  {
    id: '9',
    name: 'Kababayan',
    description: 'Little gold muffin-shaped sponge with a chewy crust. 2 pieces for 5 pesos.',
    price: 2.50,
    category: 'cake',
    image: '/images/kababayan.jpg',
    featured: false,
    stock: 80,
    ingredients: ['Flour', 'Eggs', 'Sugar', 'Milk', 'Baking powder']
  },
  {
    id: '10',
    name: 'Lambingan',
    description: 'Soft twin rolls baked side by side, buttery and lightly sweet.',
    price: 5.00,
    category: 'pastry',
    image: '/images/lambingan.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Butter', 'Sugar', 'Milk', 'Yeast']
  },
  {
    id: '11',
    name: 'Pan de Coco',
    description: 'Pillowy bun stuffed with sweet shredded coconut simmered in muscovado.',
    price: 5.00,
    category: 'bread',
    image: '/images/pan_de_coco.jpg',
    featured: true,
    stock: 45,
    ingredients: ['Flour', 'Coconut', 'Muscovado sugar', 'Butter', 'Milk', 'Yeast']
  },
  {
    id: '12',
    name: 'Pinagong',
    description: 'Marinduque-style turtle-shaped bread, firm crust with a soft, faintly sweet crumb.',
    price: 5.00,
    category: 'bread',
    image: '/images/pinagong.jpg',
    featured: false,
    stock: 45,
    ingredients: ['Flour', 'Water', 'Sugar', 'Salt', 'Yeast', 'Breadcrumbs']
  },
  {
    id: '13',
    name: 'Pineapple Pie',
    description: 'Flaky hand pie packed with sweet-tart pineapple filling.',
    price: 5.00,
    category: 'pastry',
    image: '/images/pineapple_pie.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Butter', 'Pineapple', 'Sugar', 'Eggs']
  },
  {
    id: '14',
    name: 'Spanish Bread',
    description: 'Rolled soft bread with a buttery sugar filling, baked golden and lightly crisp at the edges.',
    price: 5.00,
    category: 'bread',
    image: '/images/spanish_bread.jpg',
    featured: true,
    stock: 50,
    ingredients: ['Flour', 'Butter', 'Sugar', 'Milk', 'Breadcrumbs', 'Eggs']
  },
  {
    id: '15',
    name: 'Ube Pie',
    description: 'Flaky hand pie with a rich purple yam filling.',
    price: 5.00,
    category: 'pastry',
    image: '/images/ube_pie.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Butter', 'Ube halaya', 'Sugar', 'Eggs']
  },
  {
    id: '16',
    name: 'Ube Tsinelas',
    description: 'Slipper-shaped soft bread swirled with ube and brushed with butter.',
    price: 5.00,
    category: 'pastry',
    image: '/images/ube_tsinelas.jpg',
    featured: false,
    stock: 35,
    ingredients: ['Flour', 'Ube halaya', 'Butter', 'Sugar', 'Milk', 'Yeast']
  },
  {
    id: '17',
    name: 'Regular Pandesal',
    description: 'The everyday Filipino breakfast roll — soft, lightly sweet, and rolled in fine breadcrumbs.',
    price: 5.00,
    category: 'bread',
    image: '/images/pandesal-final.jpg',
    featured: true,
    stock: 80,
    ingredients: ['Flour', 'Sugar', 'Salt', 'Yeast', 'Butter', 'Breadcrumbs']
  },
  {
    id: '18',
    name: 'Buns',
    description: 'Golden, pillowy soft buns baked together in a tray — great on their own or for sandwiches.',
    price: 20.00,
    category: 'bread',
    image: '/images/exposed-rolls-final.jpg',
    featured: false,
    stock: 30,
    ingredients: ['Flour', 'Milk', 'Butter', 'Sugar', 'Eggs', 'Yeast']
  },
  {
    id: '19',
    name: 'Loaf Bread (Small)',
    description: 'Soft white sandwich loaf, sliced and ready for breakfast or merienda.',
    price: 25.00,
    category: 'bread',
    image: '/images/white-loaf-bread-final.jpg',
    featured: false,
    stock: 20,
    ingredients: ['Flour', 'Milk', 'Sugar', 'Butter', 'Salt', 'Yeast']
  },
  {
    id: '20',
    name: 'Loaf Bread (Large)',
    description: 'Our big soft white sandwich loaf, sliced — enough for the whole family.',
    price: 50.00,
    category: 'bread',
    image: '/images/white-loaf-bread-final.jpg',
    featured: false,
    stock: 20,
    ingredients: ['Flour', 'Milk', 'Sugar', 'Butter', 'Salt', 'Yeast']
  },
  {
    id: '21',
    name: 'Banana Bread (Slice)',
    description: 'A thick, moist slice of banana bread made with ripe bananas.',
    price: 6.00,
    category: 'cake',
    image: '/images/sliced-banana-bread-final.jpg',
    featured: false,
    stock: 40,
    ingredients: ['Flour', 'Ripe bananas', 'Sugar', 'Eggs', 'Butter', 'Baking soda']
  },
  {
    id: '22',
    name: 'Banana Bread (Whole)',
    description: 'A whole loaf of moist banana bread, perfect for sharing.',
    price: 60.00,
    category: 'cake',
    image: '/images/sliced-banana-bread-final.jpg',
    featured: true,
    stock: 10,
    ingredients: ['Flour', 'Ripe bananas', 'Sugar', 'Eggs', 'Butter', 'Baking soda']
  }
]
