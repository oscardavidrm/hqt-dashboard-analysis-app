import React, {Component} from 'react';
import {withApollo} from 'react-apollo';
import toast from 'toast-me';
import {Modal, Form, Input, Icon} from 'antd';
import {LOCATION_EDIT} from './graphql/mutations';

class EditForm extends Component {
  handleSubmit = e => {
    const {
      form,
      currentLocation: {id},
      client,
    } = this.props;

    e.preventDefault();
    form.validateFields(async (err, {name, address}) => {
      if (!err) {
        try {
          await client.mutate({
            mutation: LOCATION_EDIT,
            variables: {
              location: {id, name, address},
            },
          });

          form.resetFields();
          window.location.reload();
        } catch (e) {
          e['graphQLErrors'].map(({message}) =>
            toast(message, 'error', {duration: 3000, closeable: true})
          );
        }
      } else {
        toast('No se ha podido actualizar correctamente', 'error', {
          duration: 3000,
          closeable: true,
        });
      }
    });
  };

  handleCancel = () => {
    const {setCurrentLocation} = this.props;

    setCurrentLocation();
  };

  render() {
    const {form, currentLocation} = this.props;

    return (
      <Modal
        title={`Editando ubicación: ${currentLocation.name}`}
        visible={currentLocation !== null}
        onOk={this.handleSubmit}
        onCancel={this.handleCancel}
      >
        <Form onSubmit={this.handleSubmit}>
          <Form.Item>
            {form.getFieldDecorator('name', {
              initialValue: currentLocation.name,
            })(
              <Input
                prefix={
                  <Icon type="cloud" style={{color: 'rgba(0,0,0,.25)'}} />
                }
                placeholder="Nombre"
              />
            )}
          </Form.Item>
          <Form.Item>
            {form.getFieldDecorator('address', {
              initialValue: currentLocation.address,
            })(
              <Input
                prefix={<Icon type="team" style={{color: 'rgba(0,0,0,.25)'}} />}
                placeholder="Dirección"
              />
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default withApollo(EditForm);
