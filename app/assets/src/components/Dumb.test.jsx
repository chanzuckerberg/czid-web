import React from 'react'
import { shallow } from 'enzyme'

import Dumb from './Dumb'

describe('Dumb', () => {
  describe('when `text1` and `text2` are present', () => {
    it('renders correctly', () => {
      const props = {
        text1: 'test-1',
        text2: 'test-2',
      }

      const wrapper = shallow(<Dumb {...props} />)

      expect(wrapper.getElement()).toMatchSnapshot()
    })
  })
})
