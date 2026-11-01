package com.team04.ewaste.owner;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/api/owner/devices")
public class OwnerDeviceController {

    private final OwnerDeviceService ownerDeviceService;

    public OwnerDeviceController(OwnerDeviceService ownerDeviceService) {
        this.ownerDeviceService = ownerDeviceService;
    }

    @PostMapping
    public OwnerDeviceResponse submit(@Valid @RequestBody OwnerDeviceSubmitRequest req,
                         Authentication auth) {

        return ownerDeviceService.submit(auth.getName(), req);
    }

    @GetMapping
    public List<OwnerDeviceResponse> listMine(Authentication auth) {

        return ownerDeviceService.listMine(auth.getName());
    }

    @GetMapping("/{id}")
    public OwnerDeviceResponse getMine(@PathVariable  @NonNull UUID id,
                          Authentication auth) {

        return ownerDeviceService.getMineById(auth.getName(), id);
    }
}