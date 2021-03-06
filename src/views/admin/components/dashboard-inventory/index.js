import React, {Component} from 'react';
import {withApollo} from 'react-apollo';
import {Link} from 'react-router-dom';
import debounce from 'debounce';
import moment from 'moment';
import {Form, Row, Col, DatePicker, Radio, Input, Typography, Icon} from 'antd';
import {DragDropContext} from 'react-beautiful-dnd';
import toast from 'toast-me';
import Layout from 'components/layout/admin';
import Container from 'components/common/container';
import Column from './components/column';
import ProductForm from './components/product-form';
import GarmentForm from './components/garment-form';
import RegisterForm from './components/register-form';
import ReturnForm from './components/return-form';
import SellForm from './components/sell-form';
import {
  GET_ARTISANS,
  GET_LOCATIONS,
  GET_INVENTORY,
  GET_PRODUCT_TYPES,
} from './graphql/queries';

const {Search} = Input;
const {Group, Button} = Radio;
const {Text} = Typography;
const {RangePicker} = DatePicker;

class DashboardInventory extends Component {
  state = {
    info: {},
    filters: {
      search: '',
      start: null,
      end: null,
      date: -1,
      price: -1,
    },
    form: 'product',
    currentProductId: '',
    artisans: [],
    locations: [],
    productTypes: [],
    modalForm: '',
  };

  componentDidMount = () => this.getInventory();

  getInventory = debounce(async () => {
    const {client} = this.props;
    const {
      info,
      filters: {search, start, end, date, price},
    } = this.state;

    try {
      const [
        {
          data: {artisans},
        },
        {
          data: {locations},
        },
        {
          data: {productTypes},
        },
        {
          data: {inventory},
        },
      ] = await Promise.all([
        client.query({
          query: GET_ARTISANS,
          variables: {
            filters: {limit: 10},
          },
        }),
        client.query({
          query: GET_LOCATIONS,
          variables: {
            filters: {limit: 10},
          },
        }),
        client.query({
          query: GET_PRODUCT_TYPES,
          variables: {
            filters: {limit: 10},
          },
        }),
        client.query({
          query: GET_INVENTORY,
          variables: {
            filters: {search, start, end, date, price},
          },
        }),
      ]);

      const columnOrder = ['production', 'stock', 'dispatched'];
      const tasks = {};
      const columns = {
        production: {
          id: 'production',
          title: 'Producción',
          description:
            'Productos que aún están en proceso de manufactura y no disponibles.',
          taskIds: [],
        },
        stock: {
          id: 'stock',
          title: 'Inventario',
          description:
            'Productos disponibles en todas las ubicaciones existentes.',
          taskIds: [],
        },
        dispatched: {
          id: 'dispatched',
          title: 'Vendido',
          description: 'Productos vendidos y entregados.',
          taskIds: [],
        },
      };
      inventory.production.forEach(product => {
        tasks[product.id] = {id: product.id, product};
        columns.production.taskIds.push(product.id);
      });
      inventory.stock.forEach(product => {
        tasks[product.id] = {id: product.id, product};
        columns.stock.taskIds.push(product.id);
      });
      inventory.dispatched.forEach(product => {
        tasks[product.id] = {id: product.id, product};
        columns.dispatched.taskIds.push(product.id);
      });

      const newInfo = {...info, tasks, columns, columnOrder};

      this.setState({artisans, locations, productTypes, info: {...newInfo}});
    } catch (e) {
      toast(e, 'error', {duration: 3000, closeable: true});
    }
  }, 200);

  handleFormType = form => this.setState({form});

  showModal = modalForm => {
    this.setState({modalForm});
  };

  onDragEnd = data => {
    const {info} = this.state;
    const {destination, source, draggableId} = data;
    this.setState({currentProductId: draggableId});

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const start = info.columns[source.droppableId];
    const end = info.columns[destination.droppableId];

    if (start === end) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {...start, taskIds: newTaskIds};
      const newInfo = {
        ...info,
        columns: {
          ...info.columns,
          [newColumn.id]: newColumn,
        },
      };

      this.setState({info: newInfo});
    } else {
      if (start.id === 'production' && end.id === 'stock')
        this.showModal('register');
      else if (start.id === 'stock' && end.id === 'dispatched')
        this.showModal('sell');
      else if (start.id === 'dispatched' && end.id === 'stock')
        this.showModal('return');
      else return;

      const startTaskIds = [...start.taskIds];
      const endTaskIds = [...end.taskIds];
      startTaskIds.splice(source.index, 1);
      endTaskIds.splice(destination.index, 0, draggableId);

      const newStart = {
        ...start,
        taskIds: startTaskIds,
      };

      const newEnd = {
        ...end,
        taskIds: endTaskIds,
      };

      const newInfo = {
        ...info,
        columns: {
          ...info.columns,
          [newStart.id]: newStart,
          [newEnd.id]: newEnd,
        },
      };

      this.setState({info: newInfo});
    }
  };

  handleNewProduct = ({id, productName}, column) => {
    const {info: oldInfo} = this.state;
    const tasks = {...oldInfo.tasks};
    const columns = {...oldInfo.columns};

    tasks[id] = {id, content: productName};
    columns[column].taskIds.push(id);

    const info = {...oldInfo, tasks, columns};
    this.setState({info});
  };

  handleFilterChange = (key, value) => {
    const {filters: oldFilters} = this.state;

    const filters = {...oldFilters, [key]: value};

    this.setState({filters}, this.getInventory);
  };

  handleDateFilterChange = dates => {
    const {filters: oldFilters} = this.state;

    const start = dates[0];
    const end = dates[1];
    const filters = {...oldFilters, start, end};

    this.setState({filters}, this.getInventory);
  };

  render() {
    const {
      info,
      form,
      currentProductId,
      artisans,
      locations,
      productTypes,
      modalForm,
    } = this.state;
    const {collapsed, onCollapse, user} = this.props;

    const ProductRegisterForm = Form.create({name: 'product'})(ProductForm);
    const GarmentRegisterForm = Form.create({name: 'garment'})(GarmentForm);
    const RegisterLocation = Form.create({name: 'register'})(RegisterForm);
    const RegisterSell = Form.create({name: 'sell'})(SellForm);
    const RegisterReturn = Form.create({name: 'sell'})(ReturnForm);

    return (
      <React.Fragment>
        <Layout
          collapsed={collapsed}
          onCollapse={onCollapse}
          page="Inventory"
          user={user}
        >
          <DragDropContext onDragEnd={this.onDragEnd}>
            <Container width="75%">
              <Row type="flex" justify="center">
                <Col span={9}>
                  <Search
                    placeholder="Filtrar por código o tipo de producto"
                    onChange={({target: {value}}) =>
                      this.handleFilterChange('search', value)
                    }
                    style={{width: 250, margin: 5}}
                  />
                </Col>

                <Col span={8}>
                  <RangePicker
                    style={{margin: 5}}
                    ranges={{
                      'De hoy': [moment(), moment()],
                      'De este mes': [
                        moment().startOf('month'),
                        moment().endOf('month'),
                      ],
                      'Del mes pasado': [
                        moment()
                          .startOf('month')
                          .subtract(1, 'month'),
                        moment()
                          .endOf('month')
                          .subtract(1, 'month'),
                      ],
                    }}
                    onChange={dates => this.handleDateFilterChange(dates)}
                  />
                  <Text style={{margin: 5}} disabled>
                    Fecha:
                  </Text>
                </Col>
                <Col span={3}>
                  <Group
                    style={{margin: 5}}
                    defaultValue={-1}
                    onChange={({target: {value}}) =>
                      this.handleFilterChange('date', value)
                    }
                  >
                    <Button value={1}>
                      <Icon type="up" />
                    </Button>
                    <Button value={-1}>
                      <Icon type="down" />
                    </Button>
                  </Group>
                  <Text style={{margin: 5}} disabled>
                    Fecha:
                  </Text>
                </Col>
                <Col span={3}>
                  <Group
                    style={{margin: 5}}
                    defaultValue={-1}
                    onChange={({target: {value}}) =>
                      this.handleFilterChange('price', value)
                    }
                  >
                    <Button value={1}>
                      <Icon type="up" />
                    </Button>
                    <Button value={-1}>
                      <Icon type="down" />
                    </Button>
                  </Group>
                  <Text style={{margin: 5}} disabled>
                    Precio:
                  </Text>
                </Col>
              </Row>

              <Row type="flex" gutter={[40]} justify="center">
                {(info.columnOrder &&
                  info.columnOrder.map(columnId => {
                    const column = info.columns[columnId];
                    const tasks = column.taskIds.map(
                      taskId => info.tasks[taskId]
                    );

                    return (
                      <Column key={column.id} column={column} tasks={tasks} />
                    );
                  })) || (
                  <div>
                    Cargando inventario <Icon type="loading" />
                  </div>
                )}
              </Row>
            </Container>
          </DragDropContext>
          <Container
            title={`${form === 'product' ? 'Producto' : 'Prenda'}`}
            width="25%"
          >
            {form === 'product' ? (
              <ProductRegisterForm
                artisans={artisans}
                locations={locations}
                productTypes={productTypes}
                handleNewProduct={this.handleNewProduct}
              />
            ) : (
              <GarmentRegisterForm
                artisans={artisans}
                locations={locations}
                productTypes={productTypes}
                handleNewProduct={this.handleNewProduct}
              />
            )}
            {form === 'product' ? (
              <Link to="#" onClick={() => this.handleFormType('garment')}>
                Registrar Prenda
              </Link>
            ) : (
              <Link to="#" onClick={() => this.handleFormType('product')}>
                Registrar Producto
              </Link>
            )}
          </Container>
        </Layout>
        <RegisterLocation
          visible={modalForm === 'register'}
          locations={locations}
          showModal={this.showModal}
          handleModalSumbit={this.handleModalSumbit}
          currentProductId={currentProductId}
          getInventory={this.getInventory}
        />
        <RegisterSell
          visible={modalForm === 'sell'}
          locations={locations}
          showModal={this.showModal}
          handleModalSumbit={this.handleModalSumbit}
          currentProductId={currentProductId}
          getInventory={this.getInventory}
        />
        <RegisterReturn
          visible={modalForm === 'return'}
          showModal={this.showModal}
          handleModalSumbit={this.handleModalSumbit}
          currentProductId={currentProductId}
          getInventory={this.getInventory}
        />
      </React.Fragment>
    );
  }
}

export default withApollo(DashboardInventory);
