// Combine all reducers here
import { combineReducers } from "redux";
import dropDownReducer from "./reducers/dropDown";
import globalModalReducer from "./reducers/globalModal";
import { movableModalReducers } from "./reducers/movableModal";
import { sidebarChatModalReducers } from "./reducers/sidebarChatModal";
import { chatContainerModalReducers } from "./reducers/chatContainerModal";

export default combineReducers({
    dropDownMenu: dropDownReducer,
    globalModal: globalModalReducer,
    movableModal: movableModalReducers,
    chatModal: chatContainerModalReducers,
    sidebarModal: sidebarChatModalReducers,
});
