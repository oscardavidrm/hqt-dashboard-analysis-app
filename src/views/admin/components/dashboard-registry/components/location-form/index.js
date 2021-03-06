import React, {Component} from 'react';
import {withApollo} from 'react-apollo';
import toast from 'toast-me';
import {Form, List, Icon, Input, Button} from 'antd';
import ListContainer from './components/list';
import EditForm from './components/edit-form';
import {LOCATION_REGISTER} from './graphql/mutations';
import {GET_LOCATIONS} from './graphql/queries';

class LocationForm extends Component {
  state = {
    loading: false,
    loadingLocations: false,
    locations: [],
    currentLocation: null,
  };

  componentDidMount = async () => {
    const {client} = this.props;
    this.setState({loadingLocations: true});

    try {
      const {
        data: {locations},
      } = await client.query({
        query: GET_LOCATIONS,
        variables: {
          filters: {},
        },
      });

      if (!locations) throw new Error('No locations found');

      this.setState({locations, loadingLocations: false});
    } catch (e) {
      this.setState({loadingLocations: false});
    }
  };

  handleSubmit = e => {
    const {form, client} = this.props;
    const {locations: oldLocations} = this.state;

    this.setState({loading: true});
    e.preventDefault();
    form.validateFields(async (err, {name, address}) => {
      if (!err) {
        try {
          const {
            data: {location},
          } = await client.mutate({
            mutation: LOCATION_REGISTER,
            variables: {
              location: {name, address},
            },
          });

          toast(`New location registered: ${location.name}`, {
            duration: 3000,
            closeable: true,
          });

          const locations = [...oldLocations];
          locations.unshift(location);

          this.setState({loading: false, locations});

          form.resetFields();
          window.location.reload();
        } catch (e) {
          e['graphQLErrors'].map(({message}) =>
            toast(message, 'error', {duration: 3000, closeable: true})
          );
          this.setState({loading: false});
        }
      } else {
        this.setState({loading: false});
      }
    });
  };

  setCurrentLocation = currentLocation => this.setState({currentLocation});

  render() {
    const {form} = this.props;
    const {loading, loadingLocations, locations, currentLocation} = this.state;

    const LocationEditForm = Form.create({name: 'locationEdit'})(EditForm);

    return (
      <React.Fragment>
        <Form onSubmit={this.handleSubmit} className="location-form">
          <Form.Item>
            {form.getFieldDecorator('name', {
              rules: [{required: true, message: 'Name is required!'}],
            })(
              <Input
                prefix={<Icon type="info" style={{color: 'rgba(0,0,0,.25)'}} />}
                placeholder="Name"
              />
            )}
          </Form.Item>
          <Form.Item>
            {form.getFieldDecorator('address', {
              rules: [{required: true, message: 'Address is required!'}],
            })(
              <Input
                prefix={<Icon type="home" style={{color: 'rgba(0,0,0,.25)'}} />}
                placeholder="Address"
              />
            )}
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="location-form-button"
              icon="save"
              loading={loading}
            >
              {(loading && 'Wait..') || 'Save'}
            </Button>
          </Form.Item>
        </Form>
        <ListContainer title="Ubicaciones registradas">
          <List
            loading={loadingLocations}
            itemLayout="horizontal"
            dataSource={locations}
            size="small"
            renderItem={location => (
              <List.Item
                actions={[
                  <Icon
                    type="edit"
                    onClick={() => this.setCurrentLocation(location)}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={location.name}
                  description={`${location.address}`}
                />
              </List.Item>
            )}
          />
          {currentLocation && (
            <LocationEditForm
              setCurrentLocation={this.setCurrentLocation}
              currentLocation={currentLocation}
            />
          )}
        </ListContainer>
      </React.Fragment>
    );
  }
}

export default withApollo(LocationForm);
