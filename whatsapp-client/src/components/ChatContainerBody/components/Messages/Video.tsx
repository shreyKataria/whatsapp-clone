import s from "./messages.module.scss";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { useState } from "react";
import VideocamIcon from "@material-ui/icons/Videocam";
import CheckIcon from "@material-ui/icons/Check";
import FullscreenExitIcon from "@material-ui/icons/FullscreenExit";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloseIcon from "@material-ui/icons/Close";
import ForwardIcon from "@material-ui/icons/Forward";
import { formatTime } from "../../../../utils/formatTime";
import {
    landscapeOffset,
    potraitOffset,
} from "../../../../constants/movableModal";
import { connect } from "react-redux";
import { setMovableModal } from "../../../../redux/actions/movalbleModal";
import { setGlobalModal } from "../../../../redux/actions/setGlobalModal";

const passStateToProps = ({ movableModal }: any) => ({
    movableModal: movableModal.modal,
});

const passDispatchToProps = (dispatch: any) => ({
    setMovableModal: (modal: any) => dispatch(setMovableModal(modal)),
    setGlobalModal: (modal: any) => dispatch(setGlobalModal(modal)),
});

export const Video = connect(
    passStateToProps,
    passDispatchToProps
)(
    ({
        msgPosition,
        msgParams,
        timestamp,
        setGlobalModal,
        setMovableModal,
    }: any) => {
        const { thumbnail, url, size, duration } = msgParams;

        const [imageOrientation, setImageOrientation] = useState<any>(null);
        const [loading, setLoading] = useState<boolean>(false);
        const [downloaded, setDownloaded] = useState<boolean>(false);

        const offset =
            imageOrientation === "potrait" ? potraitOffset : landscapeOffset;

        const handleImageType = (e: any) => {
            if (e.target.naturalHeight > e.target.naturalWidth) {
                setImageOrientation("potrait");
            } else {
                setImageOrientation("landscape");
            }
        };

        const openMinimizedVideo = () => {
            setMovableModal({
                type: "minimizedVideo",
                params: {
                    src: url,
                    mode: "mini",
                    orientation: imageOrientation,
                    ...offset,
                },
            });
        };

        const openVideoPreview = () => {
            setGlobalModal({
                type: "viewMsgPreview",
                params: {
                    src: url,
                    orientation: imageOrientation,
                    previewImg: "",
                    ...offset,
                },
            });
        };

        const downloadVideo = () => {
            setLoading(true);
            setTimeout(() => {
                setDownloaded(true);
                setLoading(false);
            }, 1000);
        };

        const cancelDownload = () => {
            setLoading(false);
        };

        return (
            <span
                className={msgPosition === "right" ? s.voiceRight : s.voiceLeft}
            >
                <div className={s.video}>
                    <div
                        className={
                            imageOrientation === "potrait"
                                ? s.imgPotrait
                                : s.imgLandscape
                        }
                    >
                        <div className={s.smoke}>
                            <FullscreenExitIcon onClick={openMinimizedVideo} />
                            <ExpandMoreIcon />
                            <div
                                className={s.clickable}
                                onClick={
                                    downloaded
                                        ? openVideoPreview
                                        : loading
                                        ? cancelDownload
                                        : downloadVideo
                                }
                            />
                        </div>
                        <div className={s.thumbnailView}>
                            <div className={s.thumbnailControl}>
                                <div />
                                {!downloaded ? (
                                    <div
                                        onClick={
                                            loading
                                                ? cancelDownload
                                                : downloadVideo
                                        }
                                        className={s.downloadWrapper}
                                    >
                                        {loading ? (
                                            <button
                                                onClick={cancelDownload}
                                                className={s.loader}
                                            >
                                                <CloseIcon
                                                    className={s.closeIcon}
                                                />
                                                <CircularProgress
                                                    className={s.icon}
                                                />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={downloadVideo}
                                                className={s.download}
                                            >
                                                <ForwardIcon
                                                    className={s.downloadIcon}
                                                />
                                                <small>{size}</small>
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <PlayArrowIcon />
                                )}
                                <div className={s.thumbnailFooter}>
                                    <div className={s._A}>
                                        <VideocamIcon />
                                        <small>{duration}</small>
                                    </div>
                                    <div className={s._A}>
                                        <small>{formatTime(timestamp)}</small>
                                        <CheckIcon />
                                    </div>
                                </div>
                            </div>
                            <img
                                draggable={false}
                                className={
                                    downloaded ? s.releasedImg : s.thumbnail
                                }
                                src={thumbnail}
                                alt="file-thumbnail"
                                onLoad={handleImageType}
                            />
                        </div>
                    </div>
                </div>
            </span>
        );
    }
);