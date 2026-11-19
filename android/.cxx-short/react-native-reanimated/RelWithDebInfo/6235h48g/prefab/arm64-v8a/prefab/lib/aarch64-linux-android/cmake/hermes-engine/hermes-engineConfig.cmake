if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/tayya/.gradle/caches/8.12/transforms/31b7133dde6d153f17e4961782ac9c6a/transformed/hermes-android-0.78.2-release/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/tayya/.gradle/caches/8.12/transforms/31b7133dde6d153f17e4961782ac9c6a/transformed/hermes-android-0.78.2-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

