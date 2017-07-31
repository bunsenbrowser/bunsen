LOCAL_PATH := $(call my-dir)
include $(CLEAR_VARS)

#traverse all the directory and subdirectory
define walk
  $(wildcard $(1)) $(foreach e, $(wildcard $(1)/*), $(call walk, $(e)))
endef

LOCAL_MODULE := helloc

INCLUDE_LIST := ${shell find $(LOCAL_PATH)/../../common/ -type d}

SRC_LIST := $(wildcard $(LOCAL_PATH)/*.c)
SRC_LIST += $(filter %.c, $(call walk, $(LOCAL_PATH)/../../common))


#$(warning SRC_LIST:$(SRC_LIST))
#$(warning INCLUDE_LIST:$(INCLUDE_LIST))

LOCAL_C_INCLUDES := $(INCLUDE_LIST)
LOCAL_SRC_FILES := $(SRC_LIST:$(LOCAL_PATH)/%=%)

include $(BUILD_SHARED_LIBRARY)
